import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { AvailableMenuItem } from './menu.service';

const KEY_PREFIX = 'menu:available:';
const LOCK_PREFIX = 'menu:available:lock:';
const BASE_TTL = 120;

// Single-flight tuning. The lock TTL bounds how long a crashed loader can block
// others; the wait budget (retries * interval) should comfortably exceed a
// normal load so followers read the freshly-populated value instead of falling
// back to loading themselves.
const LOCK_TTL_SECONDS = 5;
const WAIT_RETRIES = 25;
const WAIT_INTERVAL_MS = 100;

// Releases a lock only if we still own it, so a follower that acquired the lock
// after ours expired is never deleted out from under it.
const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

type MenuItemLoader = () => Promise<AvailableMenuItem[]>;

@Injectable()
export class MenuCacheService {
  private readonly logger = new Logger(MenuCacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Read-through cache with single-flight loading. On a miss, exactly one caller
   * acquires the per-theatre lock and runs the loader; concurrent callers wait
   * for it to populate the cache rather than stampeding the database.
   */
  async getOrLoad(
    theatreId: string,
    loader: MenuItemLoader,
  ): Promise<AvailableMenuItem[]> {
    const cached = await this.get(theatreId);
    if (cached) return cached;

    const lockKey = LOCK_PREFIX + theatreId;
    const lockToken = randomUUID();
    const acquired = await this.acquireLock(lockKey, lockToken);

    if (!acquired) {
      return this.waitForCacheOrLoad(theatreId, loader);
    }

    try {
      // Another caller may have populated the cache between our miss and
      // acquiring the lock.
      const populated = await this.get(theatreId);
      if (populated) return populated;

      const items = await loader();
      await this.set(theatreId, items);
      return items;
    } finally {
      await this.releaseLock(lockKey, lockToken);
    }
  }

  async invalidate(theatreId: string): Promise<void> {
    await this.redis.del(KEY_PREFIX + theatreId);
  }

  private async get(theatreId: string): Promise<AvailableMenuItem[] | null> {
    const raw = await this.redis.get(KEY_PREFIX + theatreId);
    if (!raw) return null;
    return JSON.parse(raw) as AvailableMenuItem[];
  }

  private async set(
    theatreId: string,
    items: AvailableMenuItem[],
  ): Promise<void> {
    const jitter = Math.floor(Math.random() * 30);
    const finalTTL = BASE_TTL + jitter;
    await this.redis.set(
      KEY_PREFIX + theatreId,
      JSON.stringify(items),
      'EX',
      finalTTL,
    );
  }

  private async acquireLock(
    lockKey: string,
    lockToken: string,
  ): Promise<boolean> {
    const result = await this.redis.set(
      lockKey,
      lockToken,
      'EX',
      LOCK_TTL_SECONDS,
      'NX',
    );
    return result === 'OK';
  }

  private async releaseLock(lockKey: string, lockToken: string): Promise<void> {
    try {
      await this.redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, lockToken);
    } catch (error) {
      // A failed release is non-fatal: the lock expires via its TTL.
      this.logger.warn(
        `Failed to release menu cache lock ${lockKey}: ${String(error)}`,
      );
    }
  }

  /**
   * Follower path: poll for the value the lock holder is computing. Falls back to
   * loading directly if the holder dies or exceeds the wait budget, so a request
   * is never starved indefinitely.
   */
  private async waitForCacheOrLoad(
    theatreId: string,
    loader: MenuItemLoader,
  ): Promise<AvailableMenuItem[]> {
    for (let attempt = 0; attempt < WAIT_RETRIES; attempt++) {
      await this.sleep(WAIT_INTERVAL_MS);
      const cached = await this.get(theatreId);
      if (cached) return cached;
    }

    this.logger.warn(
      `Timed out waiting for menu cache for theatre ${theatreId}; loading directly`,
    );
    const items = await loader();
    await this.set(theatreId, items);
    return items;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
