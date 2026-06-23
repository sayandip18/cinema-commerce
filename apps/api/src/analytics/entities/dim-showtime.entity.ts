import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('dim_showtimes')
export class DimShowtime {
  @PrimaryColumn('uuid')
  showtimeId: string;

  @Column({ length: 255 })
  movieTitle: string;

  @Column({ length: 100 })
  genre: string;

  @Column({ length: 50 })
  screenName: string;

  @Column({ type: 'timestamptz' })
  showStartTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  intermissionStartTime: Date | null;
}
