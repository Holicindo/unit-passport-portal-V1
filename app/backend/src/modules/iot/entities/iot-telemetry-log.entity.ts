import { Entity, PrimaryColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';
import { generatePrefixedId } from '../../../common/utils/id-generator';

@Entity('iot_telemetry_logs')
export class IotTelemetryLog {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('IOT');
    }
  }

  // Referensi ke unit_id internal portal (UNT-xxxx)
  @Column()
  unit_id!: string;

  // Referensi ke iot_unit_id di ESP32 (HC-0001)
  @Column()
  iot_unit_id!: string;

  @Column({ type: 'float', nullable: true })
  temp_cabinet?: number;

  @Column({ type: 'float', nullable: true })
  temp_evaporator?: number;

  @Column({ type: 'float', nullable: true })
  temp_condenser?: number;

  @Column({ type: 'float', nullable: true })
  voltage?: number;

  @Column({ type: 'float', nullable: true })
  current?: number;

  @Column({ type: 'float', nullable: true })
  power?: number;

  @Column({ nullable: true })
  is_door1_open?: boolean;

  @Column({ nullable: true })
  is_door2_open?: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  recorded_at!: Date;
}
