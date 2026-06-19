import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Theatre } from '../../theatre/entities/theatre.entity';
import { Movie } from '../../movie/entities/movie.entity';

@Entity('showtimes')
@Index('IDX_SHOWTIME_THEATRE', ['theatreId'])
@Index('IDX_SHOWTIME_MOVIE', ['movieId'])
export class Showtime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  theatreId: string;

  @ManyToOne(() => Theatre)
  @JoinColumn({ name: 'theatreId' })
  theatre: Theatre;

  @Column({ type: 'uuid' })
  movieId: string;

  @ManyToOne(() => Movie)
  @JoinColumn({ name: 'movieId' })
  movie: Movie;

  @Column({ length: 50 })
  screen: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
