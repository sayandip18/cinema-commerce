import { Controller, Get } from '@nestjs/common';
import { TheatreService } from './theatre.service';

@Controller('theatres')
export class TheatreController {
  constructor(private readonly theatreService: TheatreService) {}

  @Get()
  async getAllTheatres() {
    const theatres = await this.theatreService.findAll();
    return { data: theatres };
  }
}
