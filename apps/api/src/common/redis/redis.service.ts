import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly store = new Map<string, MemoryEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const disabled = this.configService.get<string>('DISABLE_REDIS') === '1';

    // Hosts sem Redis instalado (ex: cPanel partilhado) não definem REDIS_URL/REDIS_HOST —
    // nesse caso cai automaticamente para um cache em memória local do processo (sem
    // persistência nem partilha entre processos, mas suficiente para TTLs curtos).
    if (disabled || (!redisUrl && !redisHost)) {
      this.logger.warn('RedisService em modo memória local (Redis não configurado). TTL temporário ativo.');
      this.cleanupTimer = setInterval(() => this.cleanupExpired(), 60_000);
      this.cleanupTimer.unref();
      return;
    }

    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    this.client = redisUrl
      ? new Redis(redisUrl)
      : new Redis({
          host: redisHost || 'localhost',
          port: this.configService.get<number>('REDIS_PORT', 6379),
          ...(redisPassword && { password: redisPassword }),
        });
  }

  async onModuleInit() {
    this.client?.on('error', (err) => this.logger.error('Redis connection error', err));
  }

  async onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.store.clear();
    await this.client?.quit();
  }

  async setWithTtl(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.client) {
      this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      return;
    }
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      const entry = this.store.get(key);
      if (!entry) return null;
      if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
        this.store.delete(key);
        return null;
      }
      return entry.value;
    }
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      this.store.delete(key);
      return;
    }
    await this.client.del(key);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}
