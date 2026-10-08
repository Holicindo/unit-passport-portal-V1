import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';

export enum LifecycleState {
  LEARNING = 'LEARNING',
  PROVISIONAL = 'PROVISIONAL',
  ACTIVE = 'ACTIVE',
}

@Entity('unit_health_scores')
export class UnitHealthScore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  unit_id!: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit!: Unit;

  @Column({ type: 'date' })
  date!: string; // YYYY-MM-DD

  @Column({ type: 'float', nullable: true })
  overall_score?: number; // 0-100

  @Column({ type: 'float', nullable: true })
  confidence_score?: number; // 0.0-1.0

  @Column({ type: 'enum', enum: LifecycleState, default: LifecycleState.LEARNING })
  lifecycle_state!: LifecycleState;

  // ─── METRIK DASAR (V2 Base, dipertahankan) ────────────────────────────────
  @Column({ type: 'float', nullable: true })
  tib_percentage?: number;

  @Column({ type: 'float', nullable: true })
  hdm_value?: number;

  @Column({ type: 'float', nullable: true })
  cabinet_cooling_rate?: number;

  @Column({ type: 'float', nullable: true })
  duty_cycle_percentage?: number;

  @Column({ type: 'float', nullable: true })
  starts_per_hour?: number;

  @Column({ type: 'float', nullable: true })
  condenser_peak?: number;

  // ─── SKOR SUBSISTEM 0-100 (V3) ────────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  sub_cabinet_score?: number;

  @Column({ type: 'float', nullable: true })
  sub_evaporator_score?: number;

  @Column({ type: 'float', nullable: true })
  sub_condenser_score?: number;

  @Column({ type: 'float', nullable: true })
  sub_electrical_score?: number;

  // ─── V3 EVAPORATOR FEATURES ───────────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  evap_cooling_rate?: number;

  @Column({ type: 'float', nullable: true })
  evap_drop_amplitude?: number;

  @Column({ type: 'float', nullable: true })
  cab_evap_diff?: number;

  // ─── V3 CONDENSER FEATURES ────────────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  condenser_rise?: number;

  // ─── V3 CABINET FEATURES ──────────────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  cabinet_amplitude?: number;

  // ─── V3 DIAGNOSTIC EVIDENCE (0-1) ─────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  evidence_condenser_issue?: number;

  @Column({ type: 'float', nullable: true })
  evidence_evaporator_issue?: number;

  @Column({ type: 'float', nullable: true })
  evidence_weak_cooling?: number;

  // ─── V4 BARU: DOOR RECOVERY ───────────────────────────────────────────────
  /** Rata-rata menit yang dibutuhkan suhu kabinet untuk kembali ke target setelah pintu ditutup */
  @Column({ type: 'float', nullable: true })
  door_avg_recovery_min?: number;

  /** Jumlah event pembukaan pintu dalam 24 jam */
  @Column({ type: 'int', nullable: true })
  door_event_count?: number;

  // ─── V4 BARU: VOLTAGE ANOMALY ─────────────────────────────────────────────
  /** Rasio pembacaan voltase di luar batas normal (180V–250V) */
  @Column({ type: 'float', nullable: true })
  voltage_anomaly_ratio?: number;

  // ─── V4 BARU: DEFROST DETECTION ───────────────────────────────────────────
  /** Jumlah siklus defrost yang terdeteksi */
  @Column({ type: 'int', nullable: true })
  defrost_cycle_count?: number;

  /** Rasio siklus defrost yang abnormal (terlalu lama / evap tidak turun) */
  @Column({ type: 'float', nullable: true })
  defrost_anomaly_fraction?: number;

  // ─── V4 BARU: BASELINE COMMISSIONING ─────────────────────────────────────
  /** Subsistem skor performa saat ini vs 14 hari pertama (0-100) */
  @Column({ type: 'float', nullable: true })
  sub_baseline_score?: number;

  /** Delta TIB vs baseline awal (positif = degradasi) */
  @Column({ type: 'float', nullable: true })
  baseline_tib_delta?: number;

  /** Delta cooling rate vs baseline awal (positif = degradasi) */
  @Column({ type: 'float', nullable: true })
  baseline_cooling_delta?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
