import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CONFIG } from '@scandark/config';
import Redis from 'ioredis';

@Injectable()
export class RedisRefreshTokenStore implements OnModuleDestroy {
  private readonly logger = new Logger(RedisRefreshTokenStore.name);
  private client: Redis | null = null;
  private memoryFallback = new Map<string, number>();

  private getClient(): Redis | null {
    if (this.client) return this.client;
    try {
      this.client = new Redis(REDIS_CONFIG.URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 3000,
      });
      this.client.connect().catch(() => {
        this.logger.warn('Redis unavailable — using in-memory refresh token store');
        this.client = null;
      });
      return this.client;
    } catch {
      return null;
    }
  }

  async store(userId: string, tokenHash: string, ttlSeconds: number): Promise<void> {
    const key = `refresh:${userId}:${tokenHash}`;
    const client = this.getClient();
    if (client?.status === 'ready') {
      await client.setex(key, ttlSeconds, '1');
      return;
    }
    this.memoryFallback.set(key, Date.now() + ttlSeconds * 1000);
  }

  async isValid(userId: string, tokenHash: string): Promise<boolean> {
    const key = `refresh:${userId}:${tokenHash}`;
    const client = this.getClient();
    if (client?.status === 'ready') {
      const value = await client.get(key);
      return value === '1';
    }
    const expires = this.memoryFallback.get(key);
    if (!expires) return false;
    if (expires < Date.now()) {
      this.memoryFallback.delete(key);
      return false;
    }
    return true;
  }

  async revoke(userId: string, tokenHash: string): Promise<void> {
    const key = `refresh:${userId}:${tokenHash}`;
    const client = this.getClient();
    if (client?.status === 'ready') {
      await client.del(key);
    }
    this.memoryFallback.delete(key);
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
  }
}
