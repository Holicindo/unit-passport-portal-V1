import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { FormType } from './entities/service-report.entity';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload-photos')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Upload foto laporan ke S3' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return { urls: [] };
    }
    const urls = await Promise.all(
      files.map((file) =>
        this.storageService.uploadFile(file, 'reports'),
      ),
    );
    return { urls: urls.map((r) => r.url) };
  }

  @Get('monthly')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get monthly consolidated report (Health Score & Maintenance)' })
  async getMonthlyReport(
    @Query('month') month?: string,
    @Query('clientId') clientId?: string,
    @Request() req?: any,
  ) {
    const activeClientId =
      req?.user?.role === UserRole.CLIENT ? req.user.client_id : clientId;
    return this.reportsService.generateMonthlyReport(month, activeClientId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Ambil semua laporan dengan pagination dan filter' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('unitId') unitId?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      type as FormType | 'REVISED' | undefined,
      status,
      unitId,
      search,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Buat laporan baru' })
  async create(@Body() dto: CreateServiceReportDto, @Request() req: any) {
    return this.reportsService.create(dto, req.user);
  }

  @Get('unit/:unitId')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Ambil laporan berdasarkan unit' })
  async findByUnit(
    @Param('unitId') unitId: string,
    @Request() req: any,
  ) {
    const isPublic = req?.user?.role === UserRole.CLIENT;
    return this.reportsService.findByUnit(unitId, isPublic);
  }

  @Get('service-log/:serviceLogId')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Ambil laporan berdasarkan service log' })
  async findByServiceLog(@Param('serviceLogId') serviceLogId: string) {
    return this.reportsService.findByServiceLog(serviceLogId);
  }

  @Post('delete-bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Hapus beberapa laporan sekaligus' })
  async removeBulk(@Body() body: { ids: string[] }) {
    return this.reportsService.removeBulk(body.ids);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Ambil laporan berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Update laporan' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.reportsService.update(id, body);
  }
}
