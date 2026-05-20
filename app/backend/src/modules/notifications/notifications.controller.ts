import { Controller, Get, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Mendapatkan notifikasi sistem (Lonceng)' })
  getAlerts(@Request() req: any) {
    return this.notificationsService.findAlerts(req.user.id);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Mendapatkan pesan masuk (Mail)' })
  getMessages(@Request() req: any) {
    return this.notificationsService.findMessages(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai notifikasi sebagai sudah dibaca' })
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }
}
