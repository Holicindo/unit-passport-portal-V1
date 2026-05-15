                                                                                                                                  import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Service Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PARTNER) // CLIENT explicitly excluded
  @ApiOperation({ summary: 'Create/Submit a new service report (Admin/Partner only)' })
  create(@Body() dto: CreateServiceReportDto, @Request() req: any) {
    return this.reportsService.create(dto, req.user);
  }

  @Get('unit/:unitId')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Get report history for a specific unit' })
  findByUnit(@Param('unitId') unitId: string) {
    return this.reportsService.findByUnit(unitId);
  }

  @Get(':id')                                                                     
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Get specific report details' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }
}
