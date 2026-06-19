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

  const [
    theatreCount,
    movieCount,
    showtimeCount,
    menuItemCount,
    inventoryCount,
  ] = await Promise.all([
    theatreRepo.count(),
    movieRepo.count(),
    showtimeRepo.count(),
    menuItemRepo.count(),
    inventoryRepo.count(),
  ]);

  let seededAny = false;

  let allTheatres: Theatre[];
  if (theatreCount === 0) {
    console.log('Seeding theatres...');
    allTheatres = await theatreRepo.save(
      theatres.map((t) => theatreRepo.create(t)),
    );
    seededAny = true;
  } else {
    console.log(`Theatres already exist (${theatreCount}). Skipping.`);
    allTheatres = await theatreRepo.find({ order: { createdAt: 'ASC' } });
  }

  let allMovies: Movie[];
  if (movieCount === 0) {
    console.log('Seeding movies...');
    allMovies = await movieRepo.save(
      movies.map((m) => movieRepo.create(m)),
    );
    seededAny = true;
  } else {
    console.log(`Movies already exist (${movieCount}). Skipping.`);
    allMovies = await movieRepo.find({ order: { createdAt: 'ASC' } });
  }

  if (showtimeCount === 0) {
    console.log('Seeding showtimes...');
    await showtimeRepo.save(
      showtimes.map((s) =>
        showtimeRepo.create({
          theatreId: allTheatres[s.theatreIndex].id,
          movieId: allMovies[s.movieIndex].id,
          screen: s.screen,
          startTime: new Date(s.startTime),
          price: s.price,
        }),
      ),
    );
    seededAny = true;
  } else {
    console.log(`Showtimes already exist (${showtimeCount}). Skipping.`);
  }

  let allMenuItems: MenuItem[];
  if (menuItemCount === 0) {
    console.log('Seeding menu items...');
    allMenuItems = await menuItemRepo.save(
      menuItems.map((m) => menuItemRepo.create(m)),
    );
    seededAny = true;
  } else {
    console.log(`Menu items already exist (${menuItemCount}). Skipping.`);
    allMenuItems = await menuItemRepo.find({ order: { createdAt: 'ASC' } });
  }

  if (inventoryCount === 0) {
    console.log('Seeding inventory...');
    await inventoryRepo.save(
      inventoryItems.map((inv) =>
        inventoryRepo.create({
          theatreId: allTheatres[inv.theatreIndex].id,
          menuItemId: allMenuItems[inv.menuItemIndex].id,
          quantity: inv.quantity,
        }),
      ),
    );
    seededAny = true;
  } else {
    console.log(`Inventory already exists (${inventoryCount}). Skipping.`);
  }

  if (seededAny) {
    console.log('Seed complete.');
  } else {
    console.log('All tables already populated. Nothing to seed.');
  }

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
