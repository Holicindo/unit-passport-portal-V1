import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';

@ApiTags('Clients Management')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all clients with pagination' })
  @ApiResponse({ status: 200, description: 'List of all clients' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.clientsService.findAll(page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get client by ID' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
}
