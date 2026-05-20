import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

@Entity('conversations')
export class Conversation {
  @ApiProperty({ example: 'CONV-1234567' })
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('CONV');
    }
  }

  @ApiProperty()
  @Column()
  participant_1_id!: string; // Biasanya Klien / Teknisi

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant_1_id' })
  participant_1?: User;

  @ApiProperty()
  @Column()
  participant_2_id!: string; // Biasanya Admin

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant_2_id' })
  participant_2?: User;

  @ApiProperty()
  @Column({ nullable: true })
  last_message?: string;

  @OneToMany(() => ChatMessage, message => message.conversation)
  messages?: ChatMessage[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
