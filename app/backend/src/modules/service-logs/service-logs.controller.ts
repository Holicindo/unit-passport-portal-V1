import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ServiceLogsService } from './service-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateServiceLogDto } from './dto/create-service-log.dto';

@ApiTags('Service Logs')
@Controller('service-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceLogsController {
  constructor(private readonly serviceLogsService: ServiceLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Admin/Partner: Get all service logs with pagination' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.serviceLogsService.findAll(page, limit);
  }

  @Post()
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Partner/Admin: Create a new service log (Close Ticket)' })
  @ApiResponse({ status: 201, description: 'Service log created successfully' })
  create(@Body() createServiceLogDto: CreateServiceLogDto, @Request() req: any) {
    // If partner, automatically assign their partner_id
    if (req.user.role === UserRole.PARTNER) {
      createServiceLogDto.partnerId = req.user.partner_id;
    }
    return this.serviceLogsService.create(createServiceLogDto);
  }

  @Get('unit/:unitId')
  @Roles(UserRole.CLIENT, UserRole.PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get service history for a specific unit' })
  findByUnit(@Param('unitId') unitId: string) {
    return this.serviceLogsService.findByUnit(unitId);
  }

  @Post(':id/attachments')
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Partner/Admin: Upload attachment for a service log' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.serviceLogsService.addAttachment(id, file);
  }

  @Put(':id')
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Partner/Admin: Update an existing service log' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.serviceLogsService.update(id, body);
  }

  @Post('bulk-reschedule')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reschedule multiple service logs at once' })
  bulkReschedule(@Body() body: { ids: string[]; newDate: string; newDeliveryDate?: string }) {
    return this.serviceLogsService.bulkReschedule(body.ids, body.newDate, body.newDeliveryDate);
  }
}
