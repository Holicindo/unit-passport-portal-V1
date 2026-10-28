import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, BeforeInsert } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum InstallationStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

@Entity('installations')
export class Installation {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('INS');
    }
  }

  @ManyToOne(() => Unit, { eager: false, nullable: false })
  unit!: Unit;

  @ManyToOne(() => Partner, { eager: false, nullable: true })
  partner!: Partner | null;

  @Column({ type: 'timestamp', nullable: true })
  installation_date!: Date | null;

  @Column({ type: 'text', nullable: true })
  location!: string | null;

  @Column({ type: 'varchar', nullable: true })
  technician_name!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'enum', enum: InstallationStatus, default: InstallationStatus.SCHEDULED })
  status!: InstallationStatus;

  @CreateDateColumn()
  created_at!: Date;
}
