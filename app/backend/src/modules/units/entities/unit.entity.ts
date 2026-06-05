import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { generatePrefixedId } from '../../../common/utils/id-generator';
import { Client } from '../../clients/entities/client.entity';
import { ServiceLog } from '../../service-logs/entities/service-log.entity';
import { Warranty } from '../../warranties/entities/warranty.entity';
import { OwnershipHistory } from '../../ownership/entities/ownership-history.entity';

@Entity('units')
export class Unit {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('UNT');
    }
  }

  @Index({ unique: true })
  @Column()
  serial_number!: string;

  @Column()
  model_name!: string;

  @Column({ type: 'jsonb', default: {} })
  specs!: any;

  @Index({ unique: true })
  @Column()
  qr_token!: string;

  @ApiProperty({ example: 'https://example.com/diagram.pdf', required: false })
  @Column({ nullable: true })
  exploded_view_url?: string;

  @ApiProperty({ example: 'https://example.com/circuit.pdf', required: false })
  @Column({ nullable: true })
  circuit_diagram_url?: string;

  @ApiProperty({ example: 'https://example.com/test_run.jpg', required: false })
  @Column({ nullable: true })
  test_run_image_url?: string;

  @ApiProperty({ example: 'https://example.com/diagram.jpg', required: false })
  @Column({ nullable: true })
  diagram_image_url?: string;

  @ManyToOne(() => Client, (client) => client.units)
  current_client!: Client;

  @Column({ nullable: true })
  outlet_branch!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ type: 'date', nullable: true })
  production_date!: Date;

  @Column({ type: 'date', nullable: true })
  warranty_expiry!: Date;

  @Column({ default: 'ACTIVE' })
  status!: string;

  @OneToMany(() => ServiceLog, (log) => log.unit)
  service_logs!: ServiceLog[];

  @OneToMany(() => Warranty, (warranty) => warranty.unit)
  warranties!: Warranty[];

  @OneToMany(() => OwnershipHistory, (history) => history.unit)
  ownership_history!: OwnershipHistory[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
