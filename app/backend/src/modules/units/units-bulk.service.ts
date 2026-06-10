import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Client } from '../clients/entities/client.entity';

interface ParsedRow {
  serial: string;
  modelName: string;
  customerCode: string;
  outletBranch: string;
  city: string | null;
  clientId: string | null;
  specs: Record<string, string>;
}

// City keyword lookup for Indonesian addresses
const CITY_KEYWORDS: Record<string, string> = {
  'jakarta': 'Jakarta', 'surabaya': 'Surabaya', 'bandung': 'Bandung',
  'semarang': 'Semarang', 'tangerang': 'Tangerang', 'bekasi': 'Bekasi',
  'depok': 'Depok', 'bogor': 'Bogor', 'cikarang': 'Cikarang',
  'cilegon': 'Cilegon', 'bali': 'Bali', 'yogyakarta': 'Yogyakarta',
  'medan': 'Medan', 'makassar': 'Makassar', 'palembang': 'Palembang',
  'malang': 'Malang', 'solo': 'Solo', 'cirebon': 'Cirebon',
  'denpasar': 'Denpasar', 'batam': 'Batam', 'karawang': 'Karawang',
  'purwakarta': 'Purwakarta', 'serang': 'Serang', 'salatiga': 'Salatiga',
  'kudus': 'Kudus', 'pekanbaru': 'Pekanbaru', 'lampung': 'Lampung',
  'pontianak': 'Pontianak', 'balikpapan': 'Balikpapan', 'manado': 'Manado',
  'kuala lumpur': 'Kuala Lumpur', 'ciracas': 'Jakarta', 'cibodas': 'Tangerang',
  'grogol': 'Jakarta', 'tambora': 'Jakarta', 'arcamanik': 'Bandung',
  'cibatu': 'Bandung', 'pegadungan': 'Jakarta',
};

@Injectable()
export class UnitsBulkService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  async bulkUpload(csvBuffer: Buffer, mode: 'upsert' | 'replace' = 'upsert') {
    const { lines, delimiter } = this.prepareCsv(csvBuffer);
    const colIdx = this.detectColumns(lines[0], delimiter);

    if (colIdx.serial < 0) {
      throw new BadRequestException('Kolom "Serial Number" tidak ditemukan di header CSV. Headers: ' + lines[0]);
    }

    const clientMap = await this.buildClientMap();
    const parsedRows = this.parseRows(lines, delimiter, colIdx, clientMap);

    console.log(`[BulkUpload] Parsed ${parsedRows.length} valid rows`);

    if (parsedRows.length === 0) {
      throw new BadRequestException('Tidak ada data valid ditemukan di CSV.');
    }

    const { inserted, updated } = await this.upsertUnits(parsedRows);
    const deleted = mode === 'replace' ? await this.deleteUnlistedUnits(parsedRows) : 0;

    console.log(`[BulkUpload] Done: inserted=${inserted}, updated=${updated}, deleted=${deleted}`);

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

    console.log(`[BulkUpload] Detected delimiter: ${delimiter === '\t' ? 'TAB' : delimiter}, lines: ${lines.length}`);
    return { lines, delimiter };
  }

  private detectColumns(headerLine: string, delimiter: string) {
    const headers = this.parseCsvLine(headerLine, delimiter).map(h => h.toLowerCase().trim());
    console.log(`[BulkUpload] Headers: ${headers.join(' | ')}`);

    const find = (patterns: string[]) => headers.findIndex(h => patterns.some(p => h.includes(p)));

    return {
      serial: find(['serial']),
      model: find(['item description', 'model']),
      itemCode: find(['item code']),
      customerName: find(['customer name']),
      customerCode: find(['customer code']),
      itrNumber: find(['itr#', 'itr ']),
      itrDate: find(['itr date', 'itr_date']),
      proNumber: find(['pro#', 'pro ']),
      manufactureSn: find(['manufacture']),
      unitNumber: find(['unit#']),
      startDate: find(['start date']),
      qmNumber: find(['qm#', 'qm ']),
      finishDate: find(['finish date']),
      soNumber: find(['so#', 'so ']),
      doNumber: find(['do#', 'do ']),
      deliveryDate: find(['delivery date']),
      branch: find(['branch']),
      deliveryAddress: find(['delivery address', 'address']),
    };
  }

  private async buildClientMap(): Promise<Map<string, string>> {
    const allClients = await this.clientRepo.find();
    const clientMap = new Map<string, string>();
    for (const c of allClients) {
      if ((c as any).bp_code) clientMap.set((c as any).bp_code.trim(), c.id);
    }
    return clientMap;
  }

  private parseRows(lines: string[], delimiter: string, colIdx: any, clientMap: Map<string, string>): ParsedRow[] {
    const parsedRows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const cols = this.parseCsvLine(line, delimiter);
        const serial = (cols[colIdx.serial] || '').trim();
        if (!serial || serial.toLowerCase() === 'serial number') continue;
        if (serial.length > 40) continue;
        if (this.isGarbageSerial(serial)) continue;

        const modelName = colIdx.model >= 0 ? (cols[colIdx.model] || '').trim() : '';
        const customerCode = colIdx.customerCode >= 0 ? (cols[colIdx.customerCode] || '').trim() : '';
        const itemCode = colIdx.itemCode >= 0 ? (cols[colIdx.itemCode] || '').trim() : '';

        // Skip if all critical fields are empty (garbage row)
        const criticalFields = [colIdx.itemCode, colIdx.customerCode, colIdx.itrNumber, colIdx.proNumber, colIdx.soNumber, colIdx.doNumber, colIdx.manufactureSn, colIdx.qmNumber];
        if (!modelName && criticalFields.every(idx => idx < 0 || !(cols[idx] || '').trim())) continue;

        const clientId = customerCode ? (clientMap.get(customerCode) || null) : null;
        const outletBranch = colIdx.branch >= 0 ? (cols[colIdx.branch] || '').trim() : '';
        const deliveryAddress = colIdx.deliveryAddress >= 0 ? (cols[colIdx.deliveryAddress] || '').trim() : '';
        const city = this.detectCity(deliveryAddress);
        const specs = this.buildSpecs(cols, colIdx);

        parsedRows.push({ serial, modelName, customerCode, outletBranch, city, clientId, specs });
      } catch {
        // Skip malformed rows
      }
    }
    return parsedRows;
  }

  private isGarbageSerial(serial: string): boolean {
    const sLower = serial.toLowerCase();
    if (sLower.includes('kec.') || sLower.includes('jl.') || sLower.includes('pic') || sLower.includes('jakarta') || sLower.includes('tower')) return true;
    if (serial.includes(':') || serial.includes(',') || serial.includes(' / ')) return true;
    if ((serial.match(/ /g) || []).length >= 2) return true;
    return false;
  }

  private detectCity(deliveryAddress: string): string | null {
    if (!deliveryAddress) return null;
    const addr = deliveryAddress.toLowerCase();
    for (const [key, val] of Object.entries(CITY_KEYWORDS)) {
      if (addr.includes(key)) return val;
    }
    return null;
  }

  private buildSpecs(cols: string[], colIdx: any): Record<string, string> {
    const specs: Record<string, string> = {};
    const mapping: [string, number][] = [
      ['item_code', colIdx.itemCode], ['itr_number', colIdx.itrNumber],
      ['itr_date', colIdx.itrDate], ['pro_number', colIdx.proNumber],
      ['manufacture_sn', colIdx.manufactureSn], ['unit_number', colIdx.unitNumber],
      ['qm_number', colIdx.qmNumber], ['finish_date', colIdx.finishDate],
      ['so_number', colIdx.soNumber], ['do_number', colIdx.doNumber],
      ['delivery_date', colIdx.deliveryDate], ['delivery_address', colIdx.deliveryAddress],
    ];
    for (const [key, idx] of mapping) {
      if (idx >= 0 && cols[idx]) specs[key] = cols[idx].trim();
    }
    return specs;
  }

  private async upsertUnits(parsedRows: ParsedRow[]): Promise<{ inserted: number; updated: number }> {
    const allExisting = await this.unitRepo.find({ select: ['id', 'serial_number', 'specs', 'model_name', 'outlet_branch', 'city'] });
    const existingMap = new Map<string, any>();
    for (const u of allExisting) existingMap.set(u.serial_number, u);

    let inserted = 0, updated = 0;
    const batchSize = 50;

    for (let batch = 0; batch < parsedRows.length; batch += batchSize) {
      const chunk = parsedRows.slice(batch, batch + batchSize);
      const toSave: any[] = [];

      for (const row of chunk) {
        const existing = existingMap.get(row.serial);
        if (existing) {
          existing.specs = { ...(existing.specs || {}), ...row.specs };
          if (row.modelName) existing.model_name = row.modelName;
          if (row.outletBranch) existing.outlet_branch = row.outletBranch;
          if (row.city) existing.city = row.city;
          if (row.clientId) existing.current_client = { id: row.clientId } as any;
          toSave.push(existing);
          updated++;
        } else {
          const serialSlug = row.serial.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          const unit = this.unitRepo.create({
            serial_number: row.serial,
            model_name: row.modelName || 'Unknown',
            specs: row.specs,
            qr_token: `holi-cp-${serialSlug}`,
            outlet_branch: row.outletBranch || null,
            city: row.city || null,
            current_client: row.clientId ? { id: row.clientId } as any : null,
            status: 'ACTIVE',
          } as any);
          toSave.push(unit);
          inserted++;
        }
      }

      if (toSave.length > 0) await this.unitRepo.save(toSave);
    }

    return { inserted, updated };
  }

  private async deleteUnlistedUnits(parsedRows: ParsedRow[]): Promise<number> {
    const allExisting = await this.unitRepo.find({ select: ['id', 'serial_number'] });
    const csvSet = new Set(parsedRows.map(r => r.serial));
    const toDelete = allExisting.filter(u => !csvSet.has(u.serial_number));

    if (toDelete.length === 0) return 0;

    const idsToDelete = toDelete.map(u => u.id);
    for (let b = 0; b < idsToDelete.length; b += 100) {
      const batchIds = idsToDelete.slice(b, b + 100);
      const idParams = batchIds.map((_, i) => `$${i + 1}`).join(',');
      try { await this.unitRepo.manager.query(`DELETE FROM service_logs WHERE "unitId" IN (${idParams})`, batchIds); } catch {}
      try { await this.unitRepo.manager.query(`DELETE FROM warranties WHERE "unitId" IN (${idParams})`, batchIds); } catch {}
      try { await this.unitRepo.manager.query(`DELETE FROM ownership_history WHERE "unitId" IN (${idParams})`, batchIds); } catch {}
      try { await this.unitRepo.manager.query(`DELETE FROM service_reports WHERE unit_id IN (${idParams})`, batchIds); } catch {}
      await this.unitRepo.delete(batchIds);
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
