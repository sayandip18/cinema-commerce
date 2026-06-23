import { Injectable, NotFoundException } from '@nestjs/common';
import { ShowtimeRepository } from './showtime.repository';
import { Showtime } from './entities/showtime.entity';

@Injectable()
export class ShowtimeService {
  constructor(private readonly showtimeRepository: ShowtimeRepository) {}

  async getByTheatre(theatreId: string) {
    const showtimes = await this.showtimeRepository.findByTheatreId(theatreId);
    return showtimes.map((s) => ({
      showtimeId: s.id,
      screen: s.screen,
      movieTitle: s.movie.title,
      movieGenre: s.movie.genre,
      movieDurationMinutes: s.movie.durationMinutes,
      movieRating: s.movie.rating,
      startTime: s.startTime,
      price: s.price,
    }));
  }

  async findByIdWithMovie(id: string): Promise<Showtime | null> {
    return this.showtimeRepository.findByIdWithMovie(id);
  }

  async getCurrentShowtime() {
    const showtime = await this.showtimeRepository.findFirstWithRelations();
    if (!showtime) {
      throw new NotFoundException('No showtimes available');
    }
    return {
      showtimeId: showtime.id,
      theatreId: showtime.theatre.id,
      theatreName: showtime.theatre.name,
      screen: showtime.screen,
      movieTitle: showtime.movie.title,
      startTime: showtime.startTime,
      price: showtime.price,
      seatNumber: 'A1',
    };
  }
}
