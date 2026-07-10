import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { ClientsBulkService } from './clients-bulk.service';
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
  constructor(
    private readonly clientsService: ClientsService,
    private readonly clientsBulkService: ClientsBulkService,
  ) {}

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
  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update client' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.clientsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete client' })
  remove(@Param('id') id: string) {
    return this.clientsService.delete(id);
  }

  @Post('bulk-upload')
  @ApiOperation({ summary: 'Admin: Bulk upload clients from CSV file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body('mode') mode: string,
  ) {
    if (!file) {
      return { success: false, message: 'No file uploaded' };
    }
    const uploadMode = mode === 'replace' ? 'replace' : 'upsert';
    return this.clientsBulkService.bulkUpload(file.buffer, uploadMode);
  }
}
