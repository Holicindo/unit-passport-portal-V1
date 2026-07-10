import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, BeforeInsert } from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { generatePrefixedId } from '../../../common/utils/id-generator';

@Entity('clients')
export class Client {
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrefixedId('CLI');
    }
  }

  @Column()
  company_name!: string;

  @Column({ nullable: true })
  bp_code!: string;

  @Column({ nullable: true })
  industry!: string;

  @Column({ nullable: true })
  logo_url!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ type: 'int', default: 0 })
  unit_count!: number;

  @OneToMany(() => Unit, (unit) => unit.current_client)
  units!: Unit[];

  @CreateDateColumn()
  created_at!: Date;
}
