import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, BeforeInsert } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { ServiceLogAttachment } from './service-log-attachment.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum ServiceStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('service_logs')
export class ServiceLog {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('LOG');
    }
  }

  @ManyToOne(() => Unit, (unit) => unit.service_logs)
  unit!: Unit;

  @ManyToOne(() => Partner, (partner) => partner.service_logs)
  partner!: Partner;

  @Column({ type: 'text', nullable: true })
  issue_description!: string;

  @Column({ type: 'text' })
  action_taken!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  service_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.COMPLETED })
  status!: ServiceStatus;

  @Column({ nullable: true })
  technician_name!: string;

  @OneToMany(() => ServiceLogAttachment, (attachment) => attachment.service_log)
  attachments!: ServiceLogAttachment[];

  @CreateDateColumn()
  created_at!: Date;
}
