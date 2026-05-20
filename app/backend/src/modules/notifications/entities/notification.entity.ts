import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum NotificationType {
  ALERT = 'ALERT', // Untuk Lonceng (Bell)
  MESSAGE = 'MESSAGE', // Untuk Pesan Masuk (Mail)
}

@Entity('notifications')
export class Notification {
  @ApiProperty({ example: 'NOT-1234567' })
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('NOT');
    }
  }

  @ApiProperty({ example: 'USR-1234567' })
  @Column()
  user_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ApiProperty({ enum: NotificationType })
  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.ALERT })
  type!: NotificationType;

  @ApiProperty({ example: 'Sistem' })
  @Column({ default: 'Sistem' })
  sender_name!: string;

  @ApiProperty({ example: 'Peringatan Garansi' })
  @Column()
  title!: string;

  @ApiProperty({ example: 'Garansi unit B610 akan habis dalam 7 hari.' })
  @Column('text')
  content!: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  is_read!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
