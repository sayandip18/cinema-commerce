import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Theatre } from './entities/theatre.entity';

@Injectable()
export class TheatreRepository {
  constructor(
    @InjectRepository(Theatre)
    private readonly repository: Repository<Theatre>,
  ) {}

  async findAll(): Promise<Theatre[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }
}
