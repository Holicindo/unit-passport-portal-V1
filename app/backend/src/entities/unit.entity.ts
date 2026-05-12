import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Client } from './client.entity';
import { ServiceLog } from './service-log.entity';
import { Warranty } from './warranty.entity';
import { OwnershipHistory } from './ownership-history.entity';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  serial_number: string;

  @Column()
  model_name: string;

  @Column({ type: 'jsonb', default: {} })
  specs: any;

  @Index({ unique: true })
  @Column()
  qr_token: string;

  @ManyToOne(() => Client, (client) => client.units)
  current_client: Client;

  @Column({ type: 'date', nullable: true })
  production_date: Date;

  @Column({ type: 'date', nullable: true })
  warranty_expiry: Date;

  @Column({ default: 'ACTIVE' })
  status: string;

  @OneToMany(() => ServiceLog, (log) => log.unit)
  service_logs: ServiceLog[];

  @OneToMany(() => Warranty, (warranty) => warranty.unit)
  warranties: Warranty[];

  @OneToMany(() => OwnershipHistory, (history) => history.unit)
  ownership_history: OwnershipHistory[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
