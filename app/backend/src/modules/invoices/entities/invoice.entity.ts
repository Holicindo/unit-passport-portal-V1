import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, BeforeInsert } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

export enum InvoiceStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
}

@Entity('invoices')
export class Invoice {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('INV');
    }
  }

  @Column({ type: 'varchar', nullable: true })
  invoice_number!: string | null;

  @ManyToOne(() => Unit, { eager: false, nullable: true })
  unit!: Unit | null;

  @ManyToOne(() => Partner, { eager: false, nullable: true })
  partner!: Partner | null;

  @Column({ type: 'timestamp', nullable: true })
  invoice_date!: Date | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status!: InvoiceStatus;

  @CreateDateColumn()
  created_at!: Date;
}
