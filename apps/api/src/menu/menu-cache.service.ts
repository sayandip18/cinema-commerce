import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { AvailableMenuItem } from './menu.service';

const KEY_PREFIX = 'menu:available:';
const BASE_TTL = 120;

@Injectable()
export class MenuCacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get(theatreId: string): Promise<AvailableMenuItem[] | null> {
    const raw = await this.redis.get(KEY_PREFIX + theatreId);
    if (!raw) return null;
    return JSON.parse(raw) as AvailableMenuItem[];
  }

  async set(theatreId: string, items: AvailableMenuItem[]): Promise<void> {
    const jitter = Math.floor(Math.random() * 30);
    const finalTTL = BASE_TTL + jitter;
    await this.redis.set(
      KEY_PREFIX + theatreId,
      JSON.stringify(items),
      'EX',
      finalTTL,
    );
  }

  async invalidate(theatreId: string): Promise<void> {
    await this.redis.del(KEY_PREFIX + theatreId);
  }
}
