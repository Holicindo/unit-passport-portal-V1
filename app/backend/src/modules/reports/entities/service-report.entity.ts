import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, BeforeInsert, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { User } from '../../auth/entities/user.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum FormType {
  INSPECTION = 'INSPECTION',
  COOLING_1 = 'COOLING_1',
  COOLING_2 = 'COOLING_2',
  COOLING_3 = 'COOLING_3',
  COOLING_WARM = 'COOLING_WARM',
  ISSUE_ANALYSIS = 'ISSUE_ANALYSIS',
  MAINTENANCE = 'MAINTENANCE',
  COMMISSIONING = 'COMMISSIONING',
  OTHER = 'OTHER'
}

@Entity('service_reports')
export class ServiceReport {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('REP');
    }
  }

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit!: Unit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by!: User;

  @Column({ type: 'enum', enum: FormType })
  form_type!: FormType;

  @Column({ type: 'jsonb' })
  data!: any; // Stores all dynamic fields from the 11 forms

  @Column({ type: 'text', array: true, nullable: true })
  photo_urls!: string[];

  @Column({ type: 'text', nullable: true })
  revision_note!: string;

  @Column({ default: 1 })
  version!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
