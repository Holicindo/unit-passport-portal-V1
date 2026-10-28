import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@ApiTags('Deliveries')
@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Admin/Partner/Mechanic: Get all deliveries with pagination' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.deliveriesService.findAll(page, limit);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Admin/Partner: Create a new delivery' })
  @ApiResponse({ status: 201, description: 'Delivery created successfully' })
  create(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveriesService.create(createDeliveryDto);
  }

  @Get('unit/:unitId')
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Admin/Partner/Mechanic: Get deliveries for a specific unit' })
  findByUnit(@Param('unitId') unitId: string) {
    return this.deliveriesService.findByUnit(unitId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Admin/Partner: Update an existing delivery' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.deliveriesService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete a delivery' })
  delete(@Param('id') id: string) {
    return this.deliveriesService.delete(id);
  }
}
