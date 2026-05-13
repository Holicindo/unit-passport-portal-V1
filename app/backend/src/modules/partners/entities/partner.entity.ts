import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, BeforeInsert } from 'typeorm';
import { ServiceLog } from '../../service-logs/entities/service-log.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

@Entity('partners')
export class Partner {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('PTR');
    }
  }

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
