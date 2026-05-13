import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';

@Entity('warranties')
export class Warranty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Unit, (unit) => unit.warranties)
  unit!: Unit;

  @Column()
  warranty_type!: string; // e.g., 'GENERAL', 'COMPRESSOR'

  @Column()
  duration_label!: string; // e.g., '1_TAHUN'

  @Column({ type: 'date' })
  start_date!: Date;

  @Column({ type: 'date' })
  end_date!: Date;

  @Column({ default: 'ACTIVE' })
  status!: string; // e.g., 'ACTIVE', 'EXPIRED', 'VOIDED'

  @Column({ type: 'text', nullable: true })
  voided_reason!: string;

  @CreateDateColumn()
  created_at!: Date;
}
