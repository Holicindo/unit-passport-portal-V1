import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { ServiceLog } from '../../service-logs/entities/service-log.entity';

@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  partner_name!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ nullable: true })
  contact_wa!: string;

  @OneToMany(() => ServiceLog, (log) => log.partner)
  service_logs!: ServiceLog[];

  @CreateDateColumn()
  created_at!: Date;
}
