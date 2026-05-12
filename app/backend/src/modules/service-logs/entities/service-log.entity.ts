import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { ServiceLogAttachment } from './service-log-attachment.entity';

@Entity('service_logs')
export class ServiceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Unit, (unit) => unit.service_logs)
  unit: Unit;

  @ManyToOne(() => Partner, (partner) => partner.service_logs)
  partner: Partner;

  @Column({ type: 'text', nullable: true })
  issue_description: string;

  @Column({ type: 'text' })
  action_taken: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  service_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @OneToMany(() => ServiceLogAttachment, (attachment) => attachment.service_log)
  attachments: ServiceLogAttachment[];

  @CreateDateColumn()
  created_at: Date;
}
