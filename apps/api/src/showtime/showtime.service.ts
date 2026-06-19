import { Injectable, NotFoundException } from '@nestjs/common';
import { ShowtimeRepository } from './showtime.repository';

@Injectable()
export class ShowtimeService {
  constructor(private readonly showtimeRepository: ShowtimeRepository) {}

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
