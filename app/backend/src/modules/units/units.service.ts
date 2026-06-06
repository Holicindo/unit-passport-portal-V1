import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.unitRepo.findAndCount({
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
}
