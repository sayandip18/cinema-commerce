import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from './entities/showtime.entity';

@Injectable()
export class ShowtimeRepository {
  constructor(
    @InjectRepository(Showtime)
    private readonly repository: Repository<Showtime>,
  ) {}

  async findFirstWithRelations(): Promise<Showtime | null> {
    return this.repository.findOne({
      where: {},
      relations: { theatre: true, movie: true },
      order: { startTime: 'ASC' },
    });
  }

  async findByIdWithMovie(id: string): Promise<Showtime | null> {
    return this.repository.findOne({
      where: { id },
      relations: { movie: true },
    });
  }
}
