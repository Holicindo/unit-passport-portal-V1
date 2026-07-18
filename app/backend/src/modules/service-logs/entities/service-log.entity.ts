import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, BeforeInsert } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { ServiceLogAttachment } from './service-log-attachment.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  CANCELLED = 'CANCELLED',
}

export enum TaskType {
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
  INSTALLATION = 'INSTALLATION',
}

@Entity('service_logs')
export class ServiceLog {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('ID');
    }
    if (!this.call_id) {
      this.call_id = this.id;
    }
  }

  @ManyToOne(() => Unit, (unit) => unit.service_logs)
  unit!: Unit;

  @ManyToOne(() => Partner, (partner) => partner.service_logs)
  partner!: Partner;

  @Column({ nullable: true })
  call_id!: string;

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

  @Column({ type: 'varchar', default: 'CORRECTIVE' })
  task_type!: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_date!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivery_date!: Date | null;

  @Column({ type: 'text', nullable: true })
  planning_notes!: string;

  @Column({ type: 'text', nullable: true })
  replaced_sparepart!: string;

  @Column({ default: false })
  is_allocated!: boolean;

  @OneToMany(() => ServiceLogAttachment, (attachment) => attachment.service_log)
  attachments!: ServiceLogAttachment[];

  @CreateDateColumn()
  created_at!: Date;
}
