import { Controller, Get } from '@nestjs/common';
import { ShowtimeService } from './showtime.service';

@Controller('showtimes')
export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  @Get('current')
  async getCurrent() {
    const data = await this.showtimeService.getCurrentShowtime();
    return { data };
  }
}
