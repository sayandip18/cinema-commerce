import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Theatre } from '../../theatre/entities/theatre.entity';
import { Movie } from '../../movie/entities/movie.entity';
import { Showtime } from '../../showtime/entities/showtime.entity';
import { MenuItem } from '../../menu/entities/menu-item.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import {
  theatres,
  movies,
  showtimes,
  menuItems,
  inventoryItems,
} from './seed.data';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const theatreRepo = dataSource.getRepository(Theatre);
  const movieRepo = dataSource.getRepository(Movie);
  const showtimeRepo = dataSource.getRepository(Showtime);
  const menuItemRepo = dataSource.getRepository(MenuItem);
  const inventoryRepo = dataSource.getRepository(Inventory);

  const existingTheatres = await theatreRepo.count();
  if (existingTheatres > 0) {
    console.log('Database already seeded. Skipping.');
    await app.close();
    return;
  }

  console.log('Seeding theatres...');
  const savedTheatres = await theatreRepo.save(
    theatres.map((t) => theatreRepo.create(t)),
  );

  console.log('Seeding movies...');
  const savedMovies = await movieRepo.save(
    movies.map((m) => movieRepo.create(m)),
  );

  console.log('Seeding showtimes...');
  await showtimeRepo.save(
    showtimes.map((s) =>
      showtimeRepo.create({
        theatreId: savedTheatres[s.theatreIndex].id,
        movieId: savedMovies[s.movieIndex].id,
        screen: s.screen,
        startTime: new Date(s.startTime),
        price: s.price,
      }),
    ),
  );

  console.log('Seeding menu items...');
  const savedMenuItems = await menuItemRepo.save(
    menuItems.map((m) => menuItemRepo.create(m)),
  );

  console.log('Seeding inventory...');
  await inventoryRepo.save(
    inventoryItems.map((inv) =>
      inventoryRepo.create({
        theatreId: savedTheatres[inv.theatreIndex].id,
        menuItemId: savedMenuItems[inv.menuItemIndex].id,
        quantity: inv.quantity,
      }),
    ),
  );

  console.log(
    `Seed complete: ${savedTheatres.length} theatres, ${savedMovies.length} movies, ${showtimes.length} showtimes, ${savedMenuItems.length} menu items, ${inventoryItems.length} inventory entries.`,
  );
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
