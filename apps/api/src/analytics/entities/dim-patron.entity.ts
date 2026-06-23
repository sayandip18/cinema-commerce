import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('dim_patrons')
export class DimPatron {
  @PrimaryColumn('uuid')
  patronId: string;

  @Column({ length: 20 })
  ageBucket: string;

  @Column({ length: 30 })
  gender: string;

  @Column({ type: 'timestamptz', nullable: true })
  signupDate: Date | null;
}
