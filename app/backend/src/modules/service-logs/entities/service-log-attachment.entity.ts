import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ServiceLog } from './service-log.entity';

@Entity('service_log_attachments')
export class ServiceLogAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServiceLog, (log) => log.attachments)
  service_log: ServiceLog;

  @Column()
  file_type: string; // e.g., 'PHOTO', 'PDF_SPK'

  @Column()
  file_url: string;

  @Column({ nullable: true })
  file_name: string;

  @CreateDateColumn()
  uploaded_at: Date;
}
