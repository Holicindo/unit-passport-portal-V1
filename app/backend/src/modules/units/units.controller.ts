import { Controller, Get, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@ApiTags('Units Management')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  // --- LEVEL 1: PUBLIC ---
  @Get('scan/:qr_token')
  @ApiOperation({ summary: 'Public Scan: Get basic unit info via QR token (No login required)' })
  @ApiParam({ name: 'qr_token', description: 'The unique QR token of the unit' })
  @ApiResponse({ status: 200, description: 'Basic unit information' })
  findPublicByQr(@Param('qr_token') qrToken: string) {
    return this.unitsService.findByQrTokenPublic(qrToken);
  }

  @Post(':id/request-service')
  @ApiOperation({ summary: 'Smart Routing: Request service for a unit. Automatically routes to active partner or defaults to WhatsApp HQ.' })
  requestService(
    @Param('id') id: string,
    @Body() body: { city?: string; notes?: string; contact_phone?: string; contact_name?: string }
  ) {
    return this.unitsService.requestServiceSmartRouting(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('my-fleet')
  @ApiOperation({ summary: 'Client: Get all equipment registered under the logged-in client' })
  @ApiResponse({ status: 200, description: 'Fleet overview' })
  findMyFleet(@Request() req: any) {
    return this.unitsService.findAllByClient(req.user.client_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PARTNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get full unit detail by ID' })
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  // --- LEVEL 3: PARTNER ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @Get(':id/technical')
  @ApiOperation({ summary: 'Partner: Get deep technical data (diagrams, circuits)' })
  @ApiResponse({ status: 200, description: 'Detailed technical data' })
  findTechnical(@Param('id') id: string) {
    return this.unitsService.findTechnicalById(id);
  }

  // --- LEVEL 4: ADMIN ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Admin: Get all units (Master Data) with pagination' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.unitsService.findAll(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Admin: Create a new unit' })
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post(':id/transfer')
  @ApiOperation({ summary: 'Admin: Transfer unit ownership' })
  transfer(
    @Param('id') id: string,
    @Body() transferDto: TransferOwnershipDto,
  ) {
    return this.unitsService.transferOwnership(id, transferDto);
  }
}
