import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Partners Management')
@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all service partners' })
  @ApiResponse({ status: 200, description: 'List of all partners' })
  findAll() {
    return this.partnersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new partner' })
  @ApiResponse({ status: 201, description: 'Partner created' })
  create(@Body() body: any) {
    return this.partnersService.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get partner by ID' })
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }
}
