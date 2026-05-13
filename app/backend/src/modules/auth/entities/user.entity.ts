import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Client } from '../../clients/entities/client.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 'USR-1234567' })
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('USR');
    }
  }

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role!: UserRole;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  client_id?: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  partner_id?: string;

  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner?: Partner;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
