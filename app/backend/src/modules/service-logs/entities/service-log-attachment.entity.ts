import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, BeforeInsert } from 'typeorm';
import { ServiceLog } from './service-log.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

@Entity('service_log_attachments')
export class ServiceLogAttachment {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('ATT');
    }
  }

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
