import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, BeforeInsert } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

@Entity('deliveries')
export class Delivery {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('DLV');
    }
  }

  @ManyToOne(() => Unit, { eager: false, nullable: false })
  unit!: Unit;

  @ManyToOne(() => Partner, { eager: false, nullable: true })
  partner!: Partner | null;

  @Column({ type: 'timestamp', nullable: true })
  delivery_date!: Date | null;

  @Column({ type: 'text', nullable: true })
  destination_address!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status!: DeliveryStatus;

  @CreateDateColumn()
  created_at!: Date;
}
