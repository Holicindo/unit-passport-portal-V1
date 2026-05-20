import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@ApiTags('Messages (Live Chat)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Dapatkan daftar obrolan aktif untuk pengguna' })
  getConversations(@Request() req: any) {
    return this.messagesService.getUserConversations(req.user.id);
  }

  @Post('conversations/start')
  @ApiOperation({ summary: 'Mulai atau cari obrolan dengan user lain' })
  startConversation(@Request() req: any, @Body('targetUserId') targetUserId: string) {
    return this.messagesService.findOrCreateConversation(req.user.id, targetUserId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Dapatkan riwayat chat dari satu obrolan' })
  getChatHistory(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.getChatHistory(id, req.user.id);
  }

  @Post('conversations/:id/send')
  @ApiOperation({ summary: 'Kirim pesan ke obrolan' })
  sendMessage(
    @Param('id') conversationId: string,
    @Request() req: any,
    @Body('content') content: string,
  ) {
    return this.messagesService.sendMessage(conversationId, req.user.id, content);
  }
}
