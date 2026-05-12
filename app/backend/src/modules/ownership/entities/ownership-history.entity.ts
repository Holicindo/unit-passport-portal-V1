import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity('ownership_history')
export class OwnershipHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Unit, (unit) => unit.ownership_history)
  unit: Unit;

  @ManyToOne(() => Client)
  from_client: Client;

  @ManyToOne(() => Client)
  to_client: Client;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  transfer_date: Date;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
