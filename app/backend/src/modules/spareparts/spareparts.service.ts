import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { MasterSparepart } from './entities/sparepart.entity';
import { CreateSparepartDto, UpdateSparepartDto } from './dto/sparepart.dto';
import { ServiceLog } from '../service-logs/entities/service-log.entity';

@Injectable()
export class SparepartsService {
  constructor(
    @InjectRepository(MasterSparepart)
    private readonly sparepartRepo: Repository<MasterSparepart>,
    @InjectRepository(ServiceLog)
    private readonly serviceLogRepo: Repository<ServiceLog>,
  ) {}

  /**
   * Menampilkan semua master sparepart beserta counter pemakaian di ServiceLog
   */
  async findAll(category?: string, search?: string) {
    const query = this.sparepartRepo.createQueryBuilder('sp');

    if (category && category !== 'ALL') {
      query.andWhere('sp.category = :category', { category });
    }

    if (search) {
      query.andWhere(
        '(LOWER(sp.name) LIKE LOWER(:search) OR LOWER(sp.part_number) LIKE LOWER(:search) OR LOWER(sp.id) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    query.orderBy('sp.category', 'ASC').addOrderBy('sp.name', 'ASC');

    const spareparts = await query.getMany();

    // Hitung usage count di service_logs (kolom replaced_sparepart)
    // Ambil semua service_logs yang ada replaced_sparepart-nya
    const logs = await this.serviceLogRepo
      .createQueryBuilder('log')
      .select(['log.id', 'log.replaced_sparepart', 'log.service_date', 'log.created_at'])
      .where('log.replaced_sparepart IS NOT NULL AND log.replaced_sparepart != \'\'')
      .getMany();

    return spareparts.map(sp => {
      let count = 0;
      let lastUsed: string | null = null;

      logs.forEach(l => {
        if (!l.replaced_sparepart) return;
        // Check matching name, part_number, or id
        const lowerReplaced = l.replaced_sparepart.toLowerCase();
        const matches =
          lowerReplaced.includes(sp.name.toLowerCase()) ||
          lowerReplaced.includes(sp.part_number.toLowerCase()) ||
          lowerReplaced.includes(sp.id.toLowerCase());

        if (matches) {
          count++;
          const dateStr = (l.service_date || l.created_at)?.toISOString() || null;
          if (dateStr && (!lastUsed || new Date(dateStr) > new Date(lastUsed))) {
            lastUsed = dateStr;
          }
        }
      });

      return {
        ...sp,
        default_price: Number(sp.default_price || 0),
        usage_count: count,
        last_used_at: lastUsed,
      };
    });
  }

  async findOne(id: string) {
    const item = await this.sparepartRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Sparepart with id "${id}" not found`);
    }
    return item;
  }

  async create(dto: CreateSparepartDto) {
    const exists = await this.sparepartRepo.findOne({ where: { part_number: dto.part_number } });
    if (exists) {
      throw new ConflictException(`Part Number "${dto.part_number}" sudah terdaftar.`);
    }

    const id = dto.id || `SP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const entity = new MasterSparepart();
    entity.id = id;
    entity.part_number = dto.part_number;
    entity.name = dto.name;
    entity.category = dto.category;
    entity.default_price = dto.default_price || 0;
    entity.description = dto.description;
    entity.compatibility = dto.compatibility;

    return await this.sparepartRepo.save(entity);
  }

  async update(id: string, dto: UpdateSparepartDto) {
    const item = await this.findOne(id);
    if (dto.part_number && dto.part_number !== item.part_number) {
      const exists = await this.sparepartRepo.findOne({ where: { part_number: dto.part_number } });
      if (exists) {
        throw new ConflictException(`Part Number "${dto.part_number}" sudah digunakan sparepart lain.`);
      }
    }

    Object.assign(item, dto);
    item.updated_at = new Date();
    return await this.sparepartRepo.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    await this.sparepartRepo.remove(item);
    return { success: true, message: `Sparepart "${item.name}" berhasil dihapus` };
  }

  /**
   * Ambil detail tiket servis yang memakai sparepart tertentu
   */
  async getUsageDetail(id: string) {
    const item = await this.findOne(id);

    const logs = await this.serviceLogRepo
      .createQueryBuilder('log')
      .select([
        'log.id',
        'log.service_date',
        'log.issue_description',
        'log.action_taken',
        'log.replaced_sparepart',
        'log.technician_name',
        'log.status',
        'log.created_at',
      ])
      .where("log.replaced_sparepart IS NOT NULL AND log.replaced_sparepart != ''")
      .getMany();

    const matchingLogs = logs.filter(l => {
      if (!l.replaced_sparepart) return false;
      const lower = l.replaced_sparepart.toLowerCase();
      return (
        lower.includes(item.name.toLowerCase()) ||
        lower.includes(item.part_number.toLowerCase()) ||
        lower.includes(item.id.toLowerCase())
      );
    });

    return {
      sparepart: item,
      usage_count: matchingLogs.length,
      tickets: matchingLogs.map(l => ({
        id: l.id,
        service_date: l.service_date,
        complaint: l.issue_description,
        action_taken: l.action_taken,
        technician_name: l.technician_name,
        status: l.status,
        created_at: l.created_at,
      })),
    };
  }

  /**
   * Bulk upload spareparts dari array JSON (dari file CSV / Excel)
   */
  async bulkUpload(items: CreateSparepartDto[]) {
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      if (!item.part_number || !item.name) continue;

      const existing = await this.sparepartRepo.findOne({
        where: { part_number: item.part_number.trim() },
      });

      if (existing) {
        existing.name = item.name.trim();
        existing.category = item.category?.trim() || existing.category;
        if (item.default_price !== undefined) existing.default_price = Number(item.default_price);
        if (item.description) existing.description = item.description;
        if (item.compatibility) existing.compatibility = item.compatibility;
        existing.updated_at = new Date();
        await this.sparepartRepo.save(existing);
        updatedCount++;
      } else {
        const entity = new MasterSparepart();
        entity.id = item.id || `SP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        entity.part_number = item.part_number.trim();
        entity.name = item.name.trim();
        entity.category = item.category?.trim() || 'Lain-lain';
        entity.default_price = item.default_price ? Number(item.default_price) : 0;
        entity.description = item.description || undefined;
        entity.compatibility = item.compatibility || undefined;
        await this.sparepartRepo.save(entity);
        createdCount++;
      }
    }

    return {
      success: true,
      message: `Bulk upload berhasil: ${createdCount} baru ditambahkan, ${updatedCount} diperbarui.`,
      createdCount,
      updatedCount,
    };
  }

  /**
   * Ambil daftar kategori unik untuk dropdown filter
   */
  async getCategories() {
    const result = await this.sparepartRepo
      .createQueryBuilder('sp')
      .select('DISTINCT sp.category', 'category')
      .orderBy('category', 'ASC')
      .getRawMany();

    return result.map(r => r.category).filter(Boolean);
  }
}
