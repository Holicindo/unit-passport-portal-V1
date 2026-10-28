import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { IotService } from './iot.service';
import { CreateCalibrationDto, UpdateCalibrationDto } from './dto/calibration.dto';

@ApiTags('IoT Telemetry')
@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Get('iot/alerts')
  @Roles(UserRole.CLIENT, UserRole.PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all active IoT anomaly alerts across monitored fleet' })
  getActiveAlerts() {
    return this.iotService.getActiveAlerts();
  }

  @Get(':id/telemetry/latest')
  @Roles(UserRole.CLIENT, UserRole.PARTNER, UserRole.ADMIN, UserRole.QC)
  @ApiOperation({ summary: 'Get latest real-time sensor data for a unit' })
  @ApiParam({ name: 'id', description: 'Internal Unit ID (UNT-xxxx)' })
  getLatestTelemetry(@Param('id') id: string) {
    return this.iotService.getLatestTelemetry(id);
  }

  @Get(':id/telemetry/history')
  @Roles(UserRole.CLIENT, UserRole.PARTNER, UserRole.ADMIN, UserRole.QC)
  @ApiOperation({ summary: 'Get historical sensor data for trend chart' })
  @ApiParam({ name: 'id', description: 'Internal Unit ID (UNT-xxxx)' })
  @ApiQuery({ name: 'hours', description: 'How many hours back to fetch (default: 24)', required: false })
  getTelemetryHistory(
    @Param('id') id: string,
    @Query('hours') hours: number = 24,
  ) {
    return this.iotService.getTelemetryHistory(id, Number(hours));
  }

  // ─── CALIBRATION ENDPOINTS ───────────────────────────────────────────────

  @Get(':id/calibration')
  @Roles(UserRole.PARTNER, UserRole.ADMIN, UserRole.QC)
  @ApiOperation({ summary: 'Get sensor calibration offsets for a unit' })
  @ApiParam({ name: 'id', description: 'Internal Unit ID (UNT-xxxx)' })
  getCalibration(@Param('id') id: string) {
    return this.iotService.getCalibration(id);
  }

  @Post(':id/calibration')
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update sensor calibration for a unit' })
  @ApiParam({ name: 'id', description: 'Internal Unit ID (UNT-xxxx)' })
  createCalibration(
    @Param('id') id: string,
    @Body() dto: CreateCalibrationDto,
  ) {
    return this.iotService.createOrUpdateCalibration(id, dto);
  }

  @Put(':id/calibration')
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update sensor calibration for a unit' })
  @ApiParam({ name: 'id', description: 'Internal Unit ID (UNT-xxxx)' })
  updateCalibration(
    @Param('id') id: string,
    @Body() dto: UpdateCalibrationDto,
  ) {
    return this.iotService.updateCalibration(id, dto);
  }
}
