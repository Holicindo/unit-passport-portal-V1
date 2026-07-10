import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { generatePrefixedId } from '../../common/utils/id-generator';

interface ParsedRow {
  company_name: string;
  bp_code: string | null;
  city: string | null;
  email: string | null;
}

@Injectable()
export class ClientsBulkService {
  constructor(
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  async bulkUpload(csvBuffer: Buffer, mode: 'upsert' | 'replace' = 'upsert') {
    const { lines, delimiter } = this.prepareCsv(csvBuffer);
    const colIdx = this.detectColumns(lines[0], delimiter);

    if (colIdx.name < 0) {
      throw new BadRequestException('Kolom "Nama Klien" tidak ditemukan di header CSV. Headers: ' + lines[0]);
    }

    const parsedRows = this.parseRows(lines, delimiter, colIdx);

    console.log(`[ClientsBulkUpload] Parsed ${parsedRows.length} valid rows`);

    if (parsedRows.length === 0) {
      throw new BadRequestException('Tidak ada data valid ditemukan di CSV.');
    }

    const { inserted, updated } = await this.upsertClients(parsedRows);
    const deleted = mode === 'replace' ? await this.deleteUnlistedClients(parsedRows) : 0;

    console.log(`[ClientsBulkUpload] Done: inserted=${inserted}, updated=${updated}, deleted=${deleted}`);

    return {
      success: true,
      summary: {
        total_rows: parsedRows.length,
        inserted,
        updated,
        skipped: lines.length - 2 - parsedRows.length,
        deleted,
      },
    };
  }

  private prepareCsv(csvBuffer: Buffer): { lines: string[]; delimiter: string } {
    let csvText = csvBuffer.toString('utf-8');
    if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1);

    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new BadRequestException('File CSV kosong atau tidak valid');

    const headerLine = lines[0];
    let delimiter = ',';
    const tabCount = (headerLine.match(/\t/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semiCount = (headerLine.match(/;/g) || []).length;
    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount) delimiter = ';';

    return { lines, delimiter };
  }

  private detectColumns(headerLine: string, delimiter: string) {
    const headers = this.parseCsvLine(headerLine, delimiter).map(h => h.toLowerCase().trim());
    
    const find = (patterns: string[]) => headers.findIndex(h => patterns.some(p => h.includes(p)));

    return {
      name: find(['nama klien', 'company name', 'name']),
      bpCode: find(['bp code', 'bp_code']),
      city: find(['lokasi pusat', 'city', 'lokasi']),
      email: find(['kontak / email', 'email', 'kontak', 'contact']),
    };
  }

  private parseRows(lines: string[], delimiter: string, colIdx: any): ParsedRow[] {
    const parsedRows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const cols = this.parseCsvLine(line, delimiter);
        const name = (cols[colIdx.name] || '').trim();
        if (!name) continue;

        const bpCode = colIdx.bpCode >= 0 ? (cols[colIdx.bpCode] || '').trim() : null;
        const city = colIdx.city >= 0 ? (cols[colIdx.city] || '').trim() : null;
        const email = colIdx.email >= 0 ? (cols[colIdx.email] || '').trim() : null;

        parsedRows.push({ company_name: name, bp_code: bpCode, city, email });
      } catch {
        // Skip malformed rows
      }
    }
    return parsedRows;
  }

  private async upsertClients(parsedRows: ParsedRow[]): Promise<{ inserted: number; updated: number }> {
    const allExisting = await this.clientRepo.find();
    // Use BP Code as unique identifier if available, otherwise use exact company name match
    const existingByBpCode = new Map<string, Client>();
    const existingByName = new Map<string, Client>();
    
    for (const c of allExisting) {
      if (c.bp_code) existingByBpCode.set(c.bp_code.toLowerCase(), c);
      if (c.company_name) existingByName.set(c.company_name.toLowerCase(), c);
    }

    let inserted = 0, updated = 0;
    const batchSize = 50;

    for (let batch = 0; batch < parsedRows.length; batch += batchSize) {
      const chunk = parsedRows.slice(batch, batch + batchSize);
      const toSave: Client[] = [];

      for (const row of chunk) {
        let existing = row.bp_code ? existingByBpCode.get(row.bp_code.toLowerCase()) : null;
        if (!existing) existing = existingByName.get(row.company_name.toLowerCase());

        if (existing) {
          existing.company_name = row.company_name;
          if (row.bp_code) existing.bp_code = row.bp_code;
          if (row.city) existing.city = row.city;
          if (row.email) existing.email = row.email;
          toSave.push(existing);
          updated++;
        } else {
          const client = new Client();
          Object.assign(client, {
            id: generatePrefixedId('CLI'),
            company_name: row.company_name,
            bp_code: row.bp_code || null,
            city: row.city || null,
            email: row.email || null,
          });
          toSave.push(client);
          // Add to map so duplicates in same CSV don't create multiple inserts
          if (client.bp_code) existingByBpCode.set(client.bp_code.toLowerCase(), client);
          existingByName.set(client.company_name.toLowerCase(), client);
          inserted++;
        }
      }

      if (toSave.length > 0) await this.clientRepo.save(toSave);
    }

    return { inserted, updated };
  }

  private async deleteUnlistedClients(parsedRows: ParsedRow[]): Promise<number> {
    const allExisting = await this.clientRepo.find();
    
    const csvBpCodes = new Set(parsedRows.map(r => r.bp_code?.toLowerCase()).filter(Boolean));
    const csvNames = new Set(parsedRows.map(r => r.company_name.toLowerCase()));
    
    const toDelete = allExisting.filter(c => {
      if (c.bp_code && csvBpCodes.has(c.bp_code.toLowerCase())) return false;
      if (csvNames.has(c.company_name.toLowerCase())) return false;
      return true;
    });

    if (toDelete.length === 0) return 0;

    const idsToDelete = toDelete.map(c => c.id);
    for (let b = 0; b < idsToDelete.length; b += 100) {
      const batchIds = idsToDelete.slice(b, b + 100);
      const idParams = batchIds.map((_, i) => `$${i + 1}`).join(',');
      // Optional: Clear client references from units before deleting client
      try { await this.clientRepo.manager.query(`UPDATE units SET "currentClientId" = NULL WHERE "currentClientId" IN (${idParams})`, batchIds); } catch {}
      await this.clientRepo.delete(batchIds);
    }

    return idsToDelete.length;
  }

  parseCsvLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"'; i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current); current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}
