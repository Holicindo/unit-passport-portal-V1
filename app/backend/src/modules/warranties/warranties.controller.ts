import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WarrantiesService } from './warranties.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('warranties')
@Controller('warranties')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WarrantiesController {
  constructor(private readonly warrantiesService: WarrantiesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.PARTNER)
  findAll() {
    return this.warrantiesService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() body: any) {
    return this.warrantiesService.create(body);
  }
}
