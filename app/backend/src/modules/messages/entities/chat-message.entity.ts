import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';
import { Conversation } from './conversation.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

@Entity('chat_messages')
export class ChatMessage {
  @ApiProperty({ example: 'MSG-1234567' })
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('MSG');
    }
  }

  @ApiProperty()
  @Column()
  conversation_id!: string;

  @ManyToOne(() => Conversation, conv => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @ApiProperty()
  @Column()
  sender_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender?: User;

  @ApiProperty()
  @Column('text')
  content!: string;

  @ApiProperty()
  @Column({ default: false })
  is_read!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
