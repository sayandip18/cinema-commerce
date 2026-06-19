import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Showtime } from './entities/showtime.entity';
import { ShowtimeRepository } from './showtime.repository';
import { ShowtimeService } from './showtime.service';
import { ShowtimeController } from './showtime.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Showtime])],
  controllers: [ShowtimeController],
  providers: [ShowtimeService, ShowtimeRepository],
  exports: [ShowtimeService],
})
export class ShowtimeModule {}
