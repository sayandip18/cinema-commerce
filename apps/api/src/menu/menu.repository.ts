import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';

@Injectable()
export class MenuRepository {
  constructor(
    @InjectRepository(MenuItem)
    private readonly repository: Repository<MenuItem>,
  ) {}

  async findById(id: string): Promise<MenuItem | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<MenuItem[]> {
    return this.repository.findBy(ids.map((id) => ({ id })));
  }

  async findAll(): Promise<MenuItem[]> {
    return this.repository.find({ order: { category: 'ASC', name: 'ASC' } });
  }
}
