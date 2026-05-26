                                                                                                                                  import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { Multer } from 'multer';

@ApiTags('Service Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload-photos')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @UseInterceptors(FilesInterceptor('photos'))
  @ApiOperation({ summary: 'Upload multiple photos for a report' })
  async uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    const results = await Promise.all(
      files.map(file => this.storageService.uploadFile(file, 'reports')),
    );
    return results.map(r => r.url);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Get all reports with pagination and type filtering' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
  ) {
    return this.reportsService.findAll(page, limit, type as any);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Create/Submit a new service report (Admin/Partner only)' })
  create(@Body() dto: CreateServiceReportDto, @Request() req: any) {
    return this.reportsService.create(dto, req.user);
  }

  @Get('unit/:unitId')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get report history for a specific unit' })
  findByUnit(@Param('unitId') unitId: string) {
    return this.reportsService.findByUnit(unitId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get specific report details' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post('delete-bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete multiple reports (Admin only)' })
  deleteBulk(@Body('ids') ids: string[]) {
    return this.reportsService.removeBulk(ids);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Update specific report details' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.reportsService.update(id, updateData);
  }
}
