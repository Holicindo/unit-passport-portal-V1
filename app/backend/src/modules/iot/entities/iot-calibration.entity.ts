import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';

@Entity('iot_calibration')
@Unique(['unit_id', 'sensor_type'])
export class IotCalibration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  unit_id: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ type: 'varchar', length: 50 })
  sensor_type: string; // 'CABINET', 'EVAPORATOR', 'CONDENSER'

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0.0 })
  offset_value: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  calibrated_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  calibrated_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
