import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServiceLog, ServiceStatus } from './entities/service-log.entity';
import { Unit } from '../units/entities/unit.entity';
import { Client } from '../clients/entities/client.entity';
import { generatePrefixedId } from '../../common/utils/id-generator';

export interface BulkUploadServiceLogsResult {
  totalRows: number;
  insertedLogs: number;
  skippedNoSerial: number;
  createdUnits: number;
  createdClients: number;
  errors: string[];
}

@Injectable()
export class ServiceLogsBulkService {
  private readonly logger = new Logger(ServiceLogsBulkService.name);

  constructor(
    @InjectRepository(ServiceLog) private logRepo: Repository<ServiceLog>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
    private dataSource: DataSource,
  ) { }

  async bulkUpload(fileBuffer: Buffer): Promise<BulkUploadServiceLogsResult> {
    const text = fileBuffer.toString('utf-8');
    const parsedRows = this.parseCsvFull(text);

    if (parsedRows.length < 2) {
      throw new BadRequestException('File CSV tidak memiliki baris data yang cukup.');
    }

    // Multi-Header Detection
    let headerIdx = -1;
    let dataStartIdx = 1;

    for (let i = 0; i < Math.min(6, parsedRows.length); i++) {
      const rowStr = parsedRows[i].join(' ').toLowerCase();
      if (rowStr.includes('serial number') || rowStr.includes('item description') || rowStr.includes('bp code')) {
        headerIdx = i;
        dataStartIdx = i + 1;
        break;
      }
    }

    if (headerIdx === -1) {
      for (let i = 0; i < Math.min(6, parsedRows.length); i++) {
        const rowStr = parsedRows[i].join(' ').toLowerCase();
        if (rowStr.includes('call id') || rowStr.includes('complain') || rowStr.includes('issue')) {
          headerIdx = i;
          dataStartIdx = i + 1;
          break;
        }
      }
    }

    if (headerIdx === -1) {
      headerIdx = 0;
      dataStartIdx = 1;
    }

    // Gabungkan baris header jika ada baris di atasnya (multi-row header Google Sheets)
    const currentHeaderCols = parsedRows[headerIdx];
    let combinedHeaders: string[] = currentHeaderCols.map(c => c.trim().toLowerCase());

    if (headerIdx > 0) {
      const prevHeaderCols = parsedRows[headerIdx - 1];
      combinedHeaders = currentHeaderCols.map((col, idx) => {
        const p = (prevHeaderCols[idx] || '').trim().toLowerCase();
        const c = col.trim().toLowerCase();
        return `${p} ${c}`.trim();
      });
    }

    // Mapping nama kolom ke index
    const colMap = this.mapColumns(combinedHeaders);

    this.logger.log(`[BulkUpload] Header row index: ${headerIdx + 1}, Data starts at row: ${dataStartIdx + 1}`);
    this.logger.log(`[BulkUpload] Detected column map: ${JSON.stringify(colMap)}`);

    // Ambil data klien & unit yang sudah ada di database untuk memory caching
    const existingClients = await this.clientRepo.find();
    const clientMap = new Map<string, Client>();
    for (const c of existingClients) {
      clientMap.set(c.company_name.toLowerCase().trim(), c);
    }

    const existingUnits = await this.unitRepo.find({ relations: ['current_client'] });
    const unitMap = new Map<string, Unit>();
    for (const u of existingUnits) {
      if (u.serial_number) {
        unitMap.set(u.serial_number.toLowerCase().trim(), u);
      }
    }

    const dataRows = parsedRows.slice(dataStartIdx);
    const result: BulkUploadServiceLogsResult = {
      totalRows: dataRows.length,
      insertedLogs: 0,
      skippedNoSerial: 0,
      createdUnits: 0,
      createdClients: 0,
      errors: [],
    };

    const logsToInsert: Partial<ServiceLog>[] = [];
    const createdClientsList: Client[] = [];
    const createdUnitsList: Unit[] = [];

    // Tracking tahun terakhir jika ada baris yang hanya menyebut tahun di awal section
    let currentSectionYear = 2026;

    // Proses parsing baris demi baris
    for (let i = 0; i < dataRows.length; i++) {
      const cols = dataRows[i];
      if (!cols || cols.length === 0 || cols.every(c => !c || !c.trim())) continue;

      try {
        const rawCallId = this.getColVal(cols, colMap.callId);
        const complainDateRaw = this.getColVal(cols, colMap.complainDate);
        const execDateRaw = this.getColVal(cols, colMap.executionDate);
        const custName = this.getColVal(cols, colMap.customerName) || 'Customer Umum';
        const bpCode = this.getColVal(cols, colMap.bpCode);
        const branch = this.getColVal(cols, colMap.branch);
        const address = this.getColVal(cols, colMap.address);
        const itemDesc = this.getColVal(cols, colMap.itemDescription) || 'Showcase Pendingin';
        const itemCode = this.getColVal(cols, colMap.itemCode);
        const rawSn = this.getColVal(cols, colMap.serialNumber);
        const issue = this.getColVal(cols, colMap.issue) || 'Keluhan umum';
        const handling = this.getColVal(cols, colMap.handling) || '-';
        const resText = this.getColVal(cols, colMap.result) || '-';
        const statusRaw = this.getColVal(cols, colMap.status);
        const currentActivity = this.getColVal(cols, colMap.currentActivity);
        const technician = this.getColVal(cols, colMap.technician);
        const remarks = this.getColVal(cols, colMap.remarks);

        // Update tracking tahun jika complainDateRaw berupa 4-digit tahun
        if (complainDateRaw && /^\d{4}$/.test(complainDateRaw.trim())) {
          currentSectionYear = parseInt(complainDateRaw.trim(), 10);
        }

        // 1. Validasi Serial Number: Jika kosong atau '-' atau 'null', lewati baris ini
        const rawSnTrimmed = rawSn ? rawSn.trim() : '';
        if (!rawSnTrimmed || rawSnTrimmed === '-' || rawSnTrimmed.toLowerCase() === 'null') {
          result.skippedNoSerial++;
          continue;
        }

        // Split multiple SNs dalam satu cell (dipisah newline atau spasi antar SN).
        // Contoh: "A23060648\nA23060634" → ['A23060648', 'A23060634']
        // Pola SN Holicindo: 1-2 huruf diikuti 6-10 digit angka (contoh: A23060648, ST1070236)
        const snList = rawSnTrimmed
          .split(/[\n\r]+/)                              // split by newline first
          .flatMap(line => line.split(/\s+/))            // then split tokens by whitespace
          .map(s => s.trim())
          .filter(s => {
            // Hanya terima token yang terlihat seperti serial number (hanya huruf+angka, min 5 char)
            if (!s || s === '-' || s.toLowerCase() === 'null') return false;
            // Tolak token yang terlalu pendek atau mengandung karakter aneh
            return s.length >= 5 && /^[A-Za-z0-9\-]+$/.test(s);
          });

        // Jika setelah filter tidak ada SN valid, lewati baris
        if (snList.length === 0) {
          result.skippedNoSerial++;
          continue;
        }

        // 2. Resolve or Create Client (sekali per baris CSV, tidak per SN)
        const custKey = custName.toLowerCase().trim();
        let client = clientMap.get(custKey);
        if (!client) {
          client = new Client();
          client.id = generatePrefixedId('CLI');
          client.company_name = custName;
          client.bp_code = bpCode || '';
          client.city = branch || 'Jakarta';
          clientMap.set(custKey, client);
          createdClientsList.push(client);
        }

        // 4. Resolve Call ID (sekali per baris CSV)
        let callId = rawCallId ? rawCallId.trim() : '';
        if (!callId || callId === '-' || callId.toLowerCase() === 'null') {
          callId = generatePrefixedId('ID');
        }

        // 5. Resolve Dates (Complain Date & Execution Date)
        const parsedServiceDate = this.parseDate(complainDateRaw, currentSectionYear) ||
          this.parseDate(execDateRaw, currentSectionYear) ||
          new Date(currentSectionYear, 0, 1);

        const parsedExecDate = this.parseDate(execDateRaw, currentSectionYear) || parsedServiceDate;

        // 6. Map Status
        let status = ServiceStatus.COMPLETED;
        if (statusRaw) {
          const sUpper = statusRaw.toUpperCase();
          if (sUpper.includes('PEND')) status = ServiceStatus.PENDING;
          else if (sUpper.includes('PROG')) status = ServiceStatus.IN_PROGRESS;
          else if (sUpper.includes('CANC')) status = ServiceStatus.CANCELLED;
          else if (sUpper.includes('DONE') || sUpper.includes('COMPL')) status = ServiceStatus.COMPLETED;
        }

        const internalNotesCombined = [currentActivity, remarks].filter(Boolean).join(' | ');

        // 7. Loop per SN: buat 1 unit + 1 service log entry per Serial Number
        for (const snSingle of snList) {
          // 3. Resolve or Create Unit per SN
          const snKey = snSingle.toLowerCase().trim();
          let unit = unitMap.get(snKey);
          if (!unit) {
            unit = new Unit();
            unit.id = generatePrefixedId('UNT');
            unit.serial_number = snSingle;
            unit.model_name = itemDesc;
            unit.outlet_branch = branch || '';
            unit.current_client = client;
            unit.status = 'ACTIVE';
            unit.qr_token = generatePrefixedId('QR');
            unitMap.set(snKey, unit);
            createdUnitsList.push(unit);
          }

          // Push 1 service log entry per SN
          logsToInsert.push({
            id: generatePrefixedId('ID'),
            call_id: callId,
            unit: unit,
            service_date: parsedServiceDate,
            scheduled_date: parsedExecDate,
            completed_at: status === ServiceStatus.COMPLETED ? parsedExecDate : undefined,
            issue_description: issue,
            action_taken: handling,
            planning_notes: resText,
            internal_notes: internalNotesCombined || undefined,
            technician_name: technician || 'Internal Team',
            status: status,
            task_type: 'CORRECTIVE',
            is_allocated: true,
            outlet_address: address || undefined,
          });
        }
      } catch (err: any) {
        result.errors.push(`Baris ${i + 1}: ${err.message}`);
      }
    }

    // ── Execute Batch Inserts using Transactions in Chunks of 300 ──
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Save new clients
      if (createdClientsList.length > 0) {
        for (let i = 0; i < createdClientsList.length; i += 300) {
          const chunk = createdClientsList.slice(i, i + 300);
          await queryRunner.manager.save(Client, chunk);
        }
        result.createdClients = createdClientsList.length;
      }

      // 2. Save new units
      if (createdUnitsList.length > 0) {
        for (let i = 0; i < createdUnitsList.length; i += 300) {
          const chunk = createdUnitsList.slice(i, i + 300);
          await queryRunner.manager.save(Unit, chunk);
        }
        result.createdUnits = createdUnitsList.length;
      }

      // 3. Save logs
      if (logsToInsert.length > 0) {
        for (let i = 0; i < logsToInsert.length; i += 300) {
          const chunk = logsToInsert.slice(i, i + 300);
          await queryRunner.manager.save(ServiceLog, chunk);
        }
        result.insertedLogs = logsToInsert.length;
      }

      await queryRunner.commitTransaction();
      this.logger.log(`✅ Bulk upload finished: ${result.insertedLogs} logs inserted, ${result.createdUnits} units, ${result.createdClients} clients`);
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed bulk upload transaction: ${err.message}`);
      throw new BadRequestException(`Gagal menyimpan data bulk ke database: ${err.message}`);
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  // --- Helper Delimiter Detection ---
  private detectDelimiter(lines: string[]): string {
    const sample = lines.slice(0, 3).join('\n');
    const tabs = (sample.match(/\t/g) || []).length;
    const commas = (sample.match(/,/g) || []).length;
    const semicolons = (sample.match(/;/g) || []).length;

    if (tabs > commas && tabs > semicolons) return '\t';
    if (semicolons > commas) return ';';
    return ',';
  }

  // --- Helper Robust CSV Line Parser (Handles quotes & escaped commas) ---
  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // --- Helper Map Header Names to Column Indices ---
  private mapColumns(headers: string[]): Record<string, number> {
    const findIdx = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    return {
      callId: findIdx(['call id', 'call_id', 'no call', 'tiket']),
      complainDate: findIdx(['complain', 'tgl complain', 'date complain', 'tgl komplain']),
      executionDate: findIdx(['execution', 'eksekusi', 'tgl servis', 'service date']),
      customerName: findIdx(['customer', 'name', 'pelanggan', 'klien']),
      bpCode: findIdx(['bp code', 'bp_code', 'kode bp']),
      branch: findIdx(['branch', 'cabang']),
      address: findIdx(['address', 'alamat']),
      itemDescription: findIdx(['item description', 'description', 'model', 'product']),
      itemCode: findIdx(['item code', 'kode item', 'item_code']),
      serialNumber: findIdx(['serial number', 'serial_number', 'sn']),
      issue: findIdx(['issue', 'keluhan', 'masalah', 'problem']),
      handling: findIdx(['handling', 'tindakan', 'action']),
      result: findIdx(['result', 'hasil']),
      status: findIdx(['status']),
      currentActivity: findIdx(['current activity', 'aktivitas', 'progress']),
      technician: findIdx(['technician', 'teknisi']),
      remarks: findIdx(['remarks', 'catatan', 'keterangan']),
    };
  }

  private getColVal(cols: string[], idx: number): string {
    if (idx === undefined || idx < 0 || idx >= cols.length) return '';
    return (cols[idx] || '').trim();
  }

  private parseCsvFull(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && text[i + 1] === '\n') {
          i++;
        }
        row.push(cur.trim());
        // Hanya masukkan baris jika ada setidaknya satu kolom yang terisi
        if (row.some(col => col.length > 0)) {
          rows.push(row);
        }
        row = [];
        cur = '';
      } else {
        cur += c;
      }
    }

    if (cur.length > 0 || row.length > 0) {
      row.push(cur.trim());
      if (row.some(col => col.length > 0)) {
        rows.push(row);
      }
    }

    return rows;
  }

  private parseDate(val: string, fallbackYear?: number): Date | null {
    if (!val || val === '-' || val.toLowerCase() === 'null') return null;

    const trimmed = val.trim();

    // 1. Jika murni 4 digit tahun (misal: "2017", "2018", "2023")
    if (/^\d{4}$/.test(trimmed)) {
      const y = parseInt(trimmed, 10);
      return new Date(y, 0, 1); // 1 Jan tahun tersebut
    }

    // 2. Format Indonesia/Excel: dd/mm/yyyy atau dd/mm/yy atau dd.mm.yyyy atau dd.mm.yy
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})$/);
    if (dmyMatch) {
      const d = parseInt(dmyMatch[1], 10);
      const m = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
      let y = parseInt(dmyMatch[3], 10);
      if (y < 100) y += 2000;
      return new Date(y, m, d);
    }

    // 3. Format ISO / yyyy-mm-dd
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // 4. Handle format teks bulan seperti "Jan 2", "02 Jan 2018", "Jan 15"
    const monthNames: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5, jul: 6,
      aug: 7, ags: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11
    };
    const parts = trimmed.toLowerCase().replace(/,/g, '').split(/[\s-]+/);
    if (parts.length >= 2) {
      // Kasus: "jan" "2" atau "2" "jan"
      let m = monthNames[parts[0].slice(0, 3)];
      let d = parseInt(parts[1], 10);
      if (m === undefined) {
        d = parseInt(parts[0], 10);
        m = monthNames[parts[1]?.slice(0, 3)];
      }

      if (m !== undefined && !isNaN(d)) {
        let year = fallbackYear || 2026;
        if (parts[2] && /^\d{2,4}$/.test(parts[2])) {
          let yr = parseInt(parts[2], 10);
          if (yr < 100) yr += 2000;
          year = yr;
        }
        return new Date(year, m, d);
      }
    }

    const fallbackParsed = new Date(trimmed);
    return isNaN(fallbackParsed.getTime()) ? null : fallbackParsed;
  }
}
