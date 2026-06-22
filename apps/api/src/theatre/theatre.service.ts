import { Injectable } from '@nestjs/common';
import { TheatreRepository } from './theatre.repository';
import { Theatre } from './entities/theatre.entity';

@Injectable()
export class TheatreService {
  constructor(private readonly theatreRepository: TheatreRepository) {}

  async findAll(): Promise<Theatre[]> {
    return this.theatreRepository.findAll();
  }
}
