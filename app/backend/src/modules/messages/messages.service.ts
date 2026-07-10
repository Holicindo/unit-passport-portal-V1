import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User, UserRole } from '../auth/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation)
    private convRepo: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private msgRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // Get active conversations for a user
  async getUserConversations(userId: string) {
    return this.convRepo.createQueryBuilder('conv')
      .leftJoinAndSelect('conv.participant_1', 'p1')
      .leftJoinAndSelect('conv.participant_2', 'p2')
      .where('conv.participant_1_id = :userId OR conv.participant_2_id = :userId', { userId })
      .orderBy('conv.updated_at', 'DESC')
      .getMany();
  }

  // Get chat history for a specific conversation
  async getChatHistory(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
      relations: ['participant_1', 'participant_2']
    });

    if (!conv) throw new NotFoundException('Percakapan tidak ditemukan');

    // Ensure the user is part of the conversation
    if (conv.participant_1_id !== userId && conv.participant_2_id !== userId) {
      throw new NotFoundException('Percakapan tidak ditemukan');
    }

    const messages = await this.msgRepo.find({
      where: { conversation_id: conversationId },
      order: { created_at: 'ASC' },
    });

    return {
      conversation: conv,
      messages
    };
  }

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string) {
    let conv = await this.convRepo.findOne({ where: { id: conversationId } });

    if (!conv) {
      // Logic for creating new conversation could go here if conversationId is 'new'
      throw new NotFoundException('Percakapan tidak ditemukan');
    }

    const newMessage = this.msgRepo.create({
      conversation_id: conv.id,
      sender_id: senderId,
      content,
    });

    await this.msgRepo.save(newMessage);

    // Update last message in conversation
    conv.last_message = content.length > 50 ? content.substring(0, 50) + '...' : content;
    conv.updated_at = new Date();
    await this.convRepo.save(conv);

    return newMessage;
  }

  // Find or create conversation
  async findOrCreateConversation(participant1Id: string, participant2Id: string) {
    let conv = await this.convRepo.createQueryBuilder('conv')
      .where('(conv.participant_1_id = :p1 AND conv.participant_2_id = :p2) OR (conv.participant_1_id = :p2 AND conv.participant_2_id = :p1)', { p1: participant1Id, p2: participant2Id })
      .getOne();

    if (!conv) {
      conv = this.convRepo.create({
        participant_1_id: participant1Id,
        participant_2_id: participant2Id,
      });
      conv = await this.convRepo.save(conv);
    }

    return conv;
  }

  // Find or create a conversation with the first available ADMIN (support)
  async findOrCreateSupportConversation(userId: string) {
    // Cari admin yang tersedia
    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
    if (!admin) {
      throw new NotFoundException('Tim support tidak tersedia saat ini. Silakan coba lagi nanti.');
    }
    return this.findOrCreateConversation(userId, admin.id);
  }
}
