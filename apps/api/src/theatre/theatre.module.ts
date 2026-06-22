import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theatre } from './entities/theatre.entity';
import { TheatreController } from './theatre.controller';
import { TheatreService } from './theatre.service';
import { TheatreRepository } from './theatre.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Theatre])],
  controllers: [TheatreController],
  providers: [TheatreService, TheatreRepository],
  exports: [TypeOrmModule, TheatreService],
})
export class TheatreModule {}
