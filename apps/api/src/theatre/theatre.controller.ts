import { Controller, Get, Param } from '@nestjs/common';
import { TheatreService } from './theatre.service';
import { ShowtimeService } from '../showtime/showtime.service';

@Controller('theatres')
export class TheatreController {
  constructor(
    private readonly theatreService: TheatreService,
    private readonly showtimeService: ShowtimeService,
  ) {}

  @Get()
  async getAllTheatres() {
    const theatres = await this.theatreService.findAll();
    return { data: theatres };
  }

  @Get(':theatreId/showtimes')
  async getShowtimesByTheatre(@Param('theatreId') theatreId: string) {
    const data = await this.showtimeService.getByTheatre(theatreId);
    return { data };
  }
}
