import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_name: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  logo_url: string;

  @OneToMany(() => Unit, (unit) => unit.current_client)
  units: Unit[];

  @CreateDateColumn()
  created_at: Date;
}
