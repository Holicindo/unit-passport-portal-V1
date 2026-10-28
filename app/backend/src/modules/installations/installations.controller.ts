import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InstallationsService } from './installations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateInstallationDto } from './dto/create-installation.dto';

@ApiTags('Installations')
@Controller('installations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Admin/Partner/Mechanic: Get all installations with pagination' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.installationsService.findAll(page, limit);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Admin/Partner: Create a new installation' })
  @ApiResponse({ status: 201, description: 'Installation created successfully' })
  create(@Body() createInstallationDto: CreateInstallationDto) {
    return this.installationsService.create(createInstallationDto);
  }

  @Get('unit/:unitId')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Admin/Partner/Mechanic: Get installations for a specific unit' })
  findByUnit(@Param('unitId') unitId: string) {
    return this.installationsService.findByUnit(unitId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Admin/Partner: Update an existing installation' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.installationsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete an installation' })
  delete(@Param('id') id: string) {
    return this.installationsService.delete(id);
  }
}
