import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async findAlerts(userId: string) {
    return this.notificationRepo.find({
      where: { user_id: userId, type: NotificationType.ALERT },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }

  async findMessages(userId: string) {
    return this.notificationRepo.find({
      where: { user_id: userId, type: NotificationType.MESSAGE },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(id: string, userId: string) {
    await this.notificationRepo.update(
      { id, user_id: userId },
      { is_read: true },
    );
    return { success: true };
  }

  // Helper method to create notification internally (from other services)
  async createNotification(data: Partial<Notification>) {
    const notification = this.notificationRepo.create(data);
    return this.notificationRepo.save(notification);
  }
}
