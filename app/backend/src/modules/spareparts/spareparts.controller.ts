import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SparepartsService } from './spareparts.service';
import { CreateSparepartDto, UpdateSparepartDto } from './dto/sparepart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('spareparts')
export class SparepartsController {
  constructor(private readonly sparepartsService: SparepartsService) {}

  /**
   * Public / Authenticated: ambil list sparepart untuk dropdown pengisian log servis & master data
   */
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.sparepartsService.findAll(category, search);
  }

  @Get('categories')
  async getCategories() {
    return this.sparepartsService.getCategories();
  }

  @Get(':id/usage-detail')
  async getUsageDetail(@Param('id') id: string) {
    return this.sparepartsService.getUsageDetail(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sparepartsService.findOne(id);
  }

  /**
   * Admin only: Tambah sparepart manual
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreateSparepartDto) {
    return this.sparepartsService.create(dto);
  }

  /**
   * Admin only: Bulk upload spareparts via CSV/JSON
   */
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async bulkUpload(@Body() items: CreateSparepartDto[]) {
    return this.sparepartsService.bulkUpload(items);
  }

  /**
   * Admin only: Update sparepart
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateSparepartDto) {
    return this.sparepartsService.update(id, dto);
  }

  /**
   * Admin only: Hapus sparepart
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.sparepartsService.remove(id);
  }
}
