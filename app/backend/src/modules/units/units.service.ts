import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { OwnershipHistory } from '../ownership/entities/ownership-history.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { Partner } from '../partners/entities/partner.entity';
import { ServiceLog } from '../service-logs/entities/service-log.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(OwnershipHistory) private ownershipRepo: Repository<OwnershipHistory>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  // L1 Public — Limited view for guest scan
  async findByQrTokenPublic(token_or_serial: string) {
    const unit = await this.unitRepo.findOne({
      where: [
        { qr_token: token_or_serial },
        { serial_number: token_or_serial }
      ],
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return unit;
  }

  // L2 Client — Fleet list for specific client
  async findAllByClient(clientId: string) {
    return this.unitRepo.find({
      where: { current_client: { id: clientId } },
      relations: ['warranties', 'service_logs'],
    });
  }

  // L3 Partner — Technical view
  async findTechnicalById(id: string) {
    const unit = await this.unitRepo.findOne({
      where: { id },
      relations: ['current_client', 'warranties', 'service_logs'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return unit;
  }

  // L4 Admin — Full list with pagination
  async findAll(page: number = 1, limit: number = 10, search?: string, city?: string, client?: string) {
    const where: any = {};
    if (search) where.serial_number = ILike(`%${search}%`);
    if (city) where.city = city;
    if (client) where.current_client = { id: client };

    const [data, total] = await this.unitRepo.findAndCount({
      where,
      relations: ['current_client', 'warranties', 'service_logs'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async findOne(identifier: string) {
    const unit = await this.unitRepo.findOne({
      where: [
        { id: identifier },
        { serial_number: identifier }
      ],
      relations: ['current_client', 'warranties', 'service_logs'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return unit;
  }

  // Transfer kepemilikan
  async transferOwnership(unitId: string, transferDto: TransferOwnershipDto) {
    const { toClientId, reason, notes } = transferDto;
    
    const unit = await this.unitRepo.findOne({
      where: { id: unitId },
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    const newClient = await this.clientRepo.findOne({ where: { id: toClientId } });
    if (!newClient) throw new BadRequestException('Klien tujuan tidak ditemukan');

    // Catat histori kepemilikan
    const history = this.ownershipRepo.create({
      unit,
      from_client: unit.current_client,
      to_client: newClient,
      reason,
      notes,
      transfer_date: new Date(),
    });
    await this.ownershipRepo.save(history);

    // Update pemilik saat ini
    unit.current_client = newClient;
    return this.unitRepo.save(unit);
  }

  async create(data: CreateUnitDto) {
    const { current_client_id, ...unitData } = data;
    
    const client = await this.clientRepo.findOne({ where: { id: current_client_id } });
    if (!client) throw new BadRequestException('Client tidak ditemukan');

    // Generate QR token based on serial number for readable, branded URLs
    // Format: holi-cp-[serial_number_slug] e.g. holi-cp-HOLI-SBX-2024-001
    const serialSlug = (unitData.serial_number || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')   // replace non-alphanumeric with dash
      .replace(/-+/g, '-')           // collapse multiple dashes
      .replace(/^-|-$/g, '');        // trim leading/trailing dashes

    // Ensure uniqueness — append short random suffix if token already exists
    let qr_token = `holi-cp-${serialSlug}`;
    const existing = await this.unitRepo.findOne({ where: { qr_token } });
    if (existing) {
      qr_token = `holi-cp-${serialSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const unit = this.unitRepo.create({
      ...unitData,
      qr_token,
      current_client: client,
    });
    
    const savedUnit = await this.unitRepo.save(unit);

    // Save initial ownership history record for history log tracking!
    const history = this.ownershipRepo.create({
      unit: savedUnit,
      to_client: client,
      reason: 'REGISTRASI_AWAL',
      notes: 'Initial unit passport registration and digital twin activation',
      transfer_date: new Date(),
    });
    await this.ownershipRepo.save(history);

    return savedUnit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    const unit = await this.unitRepo.findOne({
      where: { id },
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    if (dto.model_name !== undefined) unit.model_name = dto.model_name;
    if (dto.specs !== undefined) unit.specs = dto.specs;
    if (dto.warranty_expiry !== undefined) (unit as any).warranty_expiry = dto.warranty_expiry;
    if (dto.status !== undefined) (unit as any).status = dto.status;
    if (dto.test_run_image_url !== undefined) unit.test_run_image_url = dto.test_run_image_url;
    if (dto.diagram_image_url !== undefined) unit.diagram_image_url = dto.diagram_image_url;
    if (dto.outlet_branch !== undefined) unit.outlet_branch = dto.outlet_branch;
    if (dto.city !== undefined) unit.city = dto.city;

    if (dto.current_client_id) {
      const newClient = await this.clientRepo.findOne({ where: { id: dto.current_client_id } });
      if (!newClient) throw new BadRequestException('Klien tidak ditemukan');
      unit.current_client = newClient;
    }

    return this.unitRepo.save(unit);
  }

  // Admin: Regenerate QR tokens for all units to use serial-number-based format
  async regenerateAllQrTokens() {
    const units = await this.unitRepo.find();
    const results: { id: string; serial_number: string; old_token: string; new_token: string }[] = [];

    for (const unit of units) {
      const oldToken = unit.qr_token;

      // Skip if already in correct format
      if (oldToken && oldToken.startsWith('holi-cp-') && oldToken.length > 12) {
        const tokenSuffix = oldToken.replace('holi-cp-', '');
        // Check if it looks like a serial number slug (not pure random)
        if (tokenSuffix.includes('-') && tokenSuffix.length > 8) {
          results.push({ id: unit.id, serial_number: unit.serial_number, old_token: oldToken, new_token: oldToken });
          continue;
        }
      }

      // Generate new token from serial number
      const serialSlug = (unit.serial_number || unit.id)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      let newToken = `holi-cp-${serialSlug}`;

      // Check for collision with other units
      const collision = await this.unitRepo.findOne({ where: { qr_token: newToken } });
      if (collision && collision.id !== unit.id) {
        newToken = `holi-cp-${serialSlug}-${Math.random().toString(36).substring(2, 5)}`;
      }

      unit.qr_token = newToken;
      await this.unitRepo.save(unit);

      results.push({ id: unit.id, serial_number: unit.serial_number, old_token: oldToken, new_token: newToken });
    }

    return {
      success: true,
      total: units.length,
      updated: results.filter(r => r.old_token !== r.new_token).length,
      results,
    };
  }

  async requestServiceSmartRouting(unitId: string, body: { city?: string; notes?: string; contact_phone?: string; contact_name?: string }) {
    const unit = await this.unitRepo.findOne({
      where: { id: unitId },
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    // Tentukan kota untuk routing
    const targetCity = body.city || unit.specs?.city || 'Jakarta';

    // Cari partner lokal di kota tersebut yang aktif
    const partner = await this.unitRepo.manager.getRepository(Partner).findOne({
      where: { city: targetCity, is_active: true }
    });

    if (partner) {
      // Jika partner lokal siap & aktif, lakukan Smart Routing
      const logRepo = this.unitRepo.manager.getRepository(ServiceLog);
      const newLog = logRepo.create({
        unit,
        partner,
        service_date: new Date(),
        technician_name: 'Pending Assignment',
        issue_description: `${body.notes || '-'} (Kontak: ${body.contact_name || 'Outlet'} - ${body.contact_phone || '-'})`,
        action_taken: 'Menunggu penugasan teknisi dan konfirmasi jadwal servis.',
        status: 'PENDING',
      } as any);
      await logRepo.save(newLog);

      return {
        success: true,
        routed_to: 'PARTNER',
        partner_name: partner.partner_name,
        city: partner.city,
        contact_wa: partner.contact_wa,
        message: `Permintaan servis berhasil diarahkan ke partner regional kami di ${partner.city} (${partner.partner_name}). Tembusan (CC) telah dikirim ke Holicindo HQ.`,
      };
    } else {
      // Jika partner lokal belum siap / tidak aktif, simpan ke database untuk ditangani HQ
      const logRepo = this.unitRepo.manager.getRepository(ServiceLog);
      const newLog = logRepo.create({
        unit,
        service_date: new Date(),
        technician_name: 'Pending HQ Assignment',
        issue_description: `${body.notes || '-'} (Kontak: ${body.contact_name || 'Outlet'} - ${body.contact_phone || '-'})`,
        action_taken: 'Menunggu penugasan teknisi dari Holicindo HQ.',
        status: 'PENDING',
      } as any);
      await logRepo.save(newLog);

      const hqWaNumber = '+6281-2871-20358'; // Nomor WA Holicindo HQ
      const waText = `Halo Holicindo HQ, saya ingin meminta servis untuk:\n\n*Serial Number:* ${unit.serial_number}\n*Model:* ${unit.model_name}\n*Lokasi:* ${targetCity}\n*Catatan Kendala:* ${body.notes || '-'}\n\nMohon bantuannya untuk assign teknisi secara manual. Terima kasih!`;
      const waLink = `https://wa.me/${hqWaNumber}?text=${encodeURIComponent(waText)}`;

      return {
        success: true,
        routed_to: 'HQ_FALLBACK',
        whatsapp_link: waLink,
        message: `Layanan di kota ${targetCity} belum memiliki partner regional yang aktif. Permintaan Anda telah dicatat di sistem dan akan diteruskan ke Holicindo HQ via WhatsApp.`,
      };
    }
  }

  // ── Bulk Upload from CSV ──
  async bulkUpload(csvBuffer: Buffer, mode: 'upsert' | 'replace' = 'upsert') {
    let csvText = csvBuffer.toString('utf-8');
    // Strip BOM if present
    if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1);
    
    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new BadRequestException('File CSV kosong atau tidak valid');

    // Build client lookup map: bp_code → client.id
    const allClients = await this.clientRepo.find();
    const clientMap = new Map<string, string>();
    for (const c of allClients) {
      if ((c as any).bp_code) clientMap.set((c as any).bp_code.trim(), c.id);
    }

    // Detect delimiter (tab from Excel/Sheets, semicolon, or comma)
    const headerLine = lines[0];
    let delimiter = ',';
    const tabCount = (headerLine.match(/\t/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semiCount = (headerLine.match(/;/g) || []).length;
    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount) delimiter = ';';

    console.log(`[BulkUpload] Detected delimiter: ${delimiter === '\t' ? 'TAB' : delimiter}, lines: ${lines.length}`);

    // Parse header to detect column indices
    const headers = this.parseCsvLine(headerLine, delimiter).map(h => h.toLowerCase().trim());
    console.log(`[BulkUpload] Headers detected: ${headers.join(' | ')}`);

    const colIdx = {
      serial: headers.findIndex(h => h.includes('serial')),
      model: headers.findIndex(h => h.includes('item description') || h.includes('model')),
      itemCode: headers.findIndex(h => h.includes('item code')),
      customerName: headers.findIndex(h => h.includes('customer name')),
      customerCode: headers.findIndex(h => h.includes('customer code')),
      itrNumber: headers.findIndex(h => h.includes('itr#') || h.includes('itr ')),
      itrDate: headers.findIndex(h => h.includes('itr date') || h.includes('itr_date')),
      proNumber: headers.findIndex(h => h.includes('pro#') || h.includes('pro ')),
      manufactureSn: headers.findIndex(h => h.includes('manufacture')),
      unitNumber: headers.findIndex(h => h.includes('unit#') || h === 'unit'),
      startDate: headers.findIndex(h => h.includes('start date')),
      qmNumber: headers.findIndex(h => h.includes('qm#') || h.includes('qm ')),
      finishDate: headers.findIndex(h => h.includes('finish date')),
      soNumber: headers.findIndex(h => h.includes('so#') || h.includes('so ')),
      doNumber: headers.findIndex(h => h.includes('do#') || h.includes('do ')),
      deliveryDate: headers.findIndex(h => h.includes('delivery date')),
      branch: headers.findIndex(h => h.includes('branch')),
      deliveryAddress: headers.findIndex(h => h.includes('delivery address') || h.includes('address')),
    };

    console.log(`[BulkUpload] Column indices:`, JSON.stringify(colIdx));

    if (colIdx.serial < 0) {
      throw new BadRequestException('Kolom "Serial Number" tidak ditemukan di header CSV. Headers: ' + headers.join(', '));
    }

    // City lookup
    const cityKeywords: Record<string, string> = {
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

    // ── Phase 1: Parse all rows into structured data ──
    const parsedRows: Array<{
      serial: string; modelName: string; customerCode: string;
      outletBranch: string; city: string | null; clientId: string | null;
      specs: Record<string, string>;
    }> = [];
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const cols = this.parseCsvLine(line, delimiter);
        const serial = (cols[colIdx.serial] || '').trim();
        if (!serial || serial.toLowerCase() === 'serial number') continue;
        
        // Skip garbage rows from Excel (e.g., merged cells containing addresses in the first column)
        if (serial.length > 40) continue;
        const sLower = serial.toLowerCase();
        if (sLower.includes('kec.') || sLower.includes('jl.') || sLower.includes('pic') || sLower.includes('jakarta') || sLower.includes('tower')) continue;
        if (serial.includes(':') || serial.includes(',') || serial.includes(' / ')) continue;
        if ((serial.match(/ /g) || []).length >= 2) continue; // More than 1 space means it's a sentence or address

        const modelName = colIdx.model >= 0 ? (cols[colIdx.model] || '').trim() : '';
        const customerCode = colIdx.customerCode >= 0 ? (cols[colIdx.customerCode] || '').trim() : '';
        const itemCode = colIdx.itemCode >= 0 ? (cols[colIdx.itemCode] || '').trim() : '';
        const itrNumber = colIdx.itrNumber >= 0 ? (cols[colIdx.itrNumber] || '').trim() : '';
        const itrDate = colIdx.itrDate >= 0 ? (cols[colIdx.itrDate] || '').trim() : '';
        const proNumber = colIdx.proNumber >= 0 ? (cols[colIdx.proNumber] || '').trim() : '';
        const manufactureSn = colIdx.manufactureSn >= 0 ? (cols[colIdx.manufactureSn] || '').trim() : '';
        const unitNumber = colIdx.unitNumber >= 0 ? (cols[colIdx.unitNumber] || '').trim() : '';
        const qmNumber = colIdx.qmNumber >= 0 ? (cols[colIdx.qmNumber] || '').trim() : '';
        const finishDate = colIdx.finishDate >= 0 ? (cols[colIdx.finishDate] || '').trim() : '';
        const soNumber = colIdx.soNumber >= 0 ? (cols[colIdx.soNumber] || '').trim() : '';
        const doNumber = colIdx.doNumber >= 0 ? (cols[colIdx.doNumber] || '').trim() : '';
        const deliveryDate = colIdx.deliveryDate >= 0 ? (cols[colIdx.deliveryDate] || '').trim() : '';
        const outletBranch = colIdx.branch >= 0 ? (cols[colIdx.branch] || '').trim() : '';
        const deliveryAddress = colIdx.deliveryAddress >= 0 ? (cols[colIdx.deliveryAddress] || '').trim() : '';

        // Strict validation: if this is a real unit from master data, it MUST have at least one other field.
        // If all these critical fields are empty, it's a garbage row from Excel (like merged address cells).
        if (!modelName && !itemCode && !customerCode && !itrNumber && !proNumber && !soNumber && !doNumber && !manufactureSn && !qmNumber) {
          continue;
        }

        const clientId = customerCode ? (clientMap.get(customerCode) || null) : null;

        let city: string | null = null;
        if (deliveryAddress) {
          const addr = deliveryAddress.toLowerCase();
          for (const [key, val] of Object.entries(cityKeywords)) {
            if (addr.includes(key)) { city = val; break; }
          }
        }

        const specs: Record<string, string> = {};
        if (itemCode) specs.item_code = itemCode;
        if (itrNumber) specs.itr_number = itrNumber;
        if (itrDate) specs.itr_date = itrDate;
        if (proNumber) specs.pro_number = proNumber;
        if (manufactureSn) specs.manufacture_sn = manufactureSn;
        if (unitNumber) specs.unit_number = unitNumber;
        if (qmNumber) specs.qm_number = qmNumber;
        if (finishDate) specs.finish_date = finishDate;
        if (soNumber) specs.so_number = soNumber;
        if (doNumber) specs.do_number = doNumber;
        if (deliveryDate) specs.delivery_date = deliveryDate;
        if (deliveryAddress) specs.delivery_address = deliveryAddress;

        parsedRows.push({ serial, modelName, customerCode, outletBranch, city, clientId, specs });
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
        skipped++;
      }
    }

    console.log(`[BulkUpload] Parsed ${parsedRows.length} valid rows, ${skipped} skipped`);

    if (parsedRows.length === 0) {
      throw new BadRequestException('Tidak ada data valid ditemukan di CSV. Pastikan file menggunakan format yang benar.');
    }

    // ── Phase 2: Batch lookup existing units ──
    const allExistingUnits = await this.unitRepo.find({ select: ['id', 'serial_number', 'specs', 'model_name', 'outlet_branch', 'city'] });
    const existingMap = new Map<string, any>();
    for (const u of allExistingUnits) {
      existingMap.set(u.serial_number, u);
    }

    // ── Phase 3: Separate into inserts and updates ──
    let inserted = 0, updated = 0;
    const processedSerials: string[] = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let batch = 0; batch < parsedRows.length; batch += batchSize) {
      const chunk = parsedRows.slice(batch, batch + batchSize);
      const toSave: any[] = [];

      for (const row of chunk) {
        processedSerials.push(row.serial);
        const existing = existingMap.get(row.serial);

        if (existing) {
          // Update existing
          const mergedSpecs = { ...(existing.specs || {}), ...row.specs };
          existing.specs = mergedSpecs;
          if (row.modelName) existing.model_name = row.modelName;
          if (row.outletBranch) existing.outlet_branch = row.outletBranch;
          if (row.city) existing.city = row.city;
          if (row.clientId) existing.current_client = { id: row.clientId } as any;
          toSave.push(existing);
          updated++;
        } else {
          // Create new
          const serialSlug = row.serial.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          const qrToken = `holi-cp-${serialSlug}`;

          const unit = this.unitRepo.create({
            serial_number: row.serial,
            model_name: row.modelName || 'Unknown',
            specs: row.specs,
            qr_token: qrToken,
            outlet_branch: row.outletBranch || null,
            city: row.city || null,
            current_client: row.clientId ? { id: row.clientId } as any : null,
            status: 'ACTIVE',
          } as any);
          toSave.push(unit);
          inserted++;
        }
      }

      // Save entire batch at once
      if (toSave.length > 0) {
        await this.unitRepo.save(toSave);
      }
    }

    // ── Phase 4: Delete units not in CSV (replace mode) ──
    let deleted = 0;
    if (mode === 'replace' && processedSerials.length > 0) {
      const csvSet = new Set(processedSerials);
      const toDelete = allExistingUnits.filter(u => !csvSet.has(u.serial_number));

      if (toDelete.length > 0) {
        const idsToDelete = toDelete.map(u => u.id);
        // Delete in batches of 100 to avoid parameter limit
        for (let b = 0; b < idsToDelete.length; b += 100) {
          const batchIds = idsToDelete.slice(b, b + 100);
          const idParams = batchIds.map((_, i) => `$${i + 1}`).join(',');
          try { await this.unitRepo.manager.query(`DELETE FROM service_logs WHERE "unitId" IN (${idParams})`, batchIds); } catch {}
          try { await this.unitRepo.manager.query(`DELETE FROM warranties WHERE "unitId" IN (${idParams})`, batchIds); } catch {}
          try { await this.unitRepo.manager.query(`DELETE FROM ownership_history WHERE "unitId" IN (${idParams})`, batchIds); } catch {}
          try { await this.unitRepo.manager.query(`DELETE FROM service_reports WHERE unit_id IN (${idParams})`, batchIds); } catch {}
          try { await this.unitRepo.manager.query(`DELETE FROM qc_reports WHERE "unitId" IN (${idParams})`, batchIds); } catch {}
          await this.unitRepo.delete(batchIds);
        }
        deleted = idsToDelete.length;
      }
    }

    console.log(`[BulkUpload] Done: inserted=${inserted}, updated=${updated}, deleted=${deleted}`);

    return {
      success: true,
      summary: {
        total_rows: processedSerials.length,
        inserted,
        updated,
        skipped,
        deleted,
      },
      errors: errors.slice(0, 20),
    };
  }

  // Helper: parse a single CSV line respecting quoted fields
  private parseCsvLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}
