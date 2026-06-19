import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theatre } from './entities/theatre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Theatre])],
  exports: [TypeOrmModule],
})
export class TheatreModule {}
