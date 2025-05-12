import Redis, { Redis as RedisInstance, RedisOptions } from 'ioredis';
import { bLogger } from '../logger';
import { IBaseRedis } from './iBaseRedis';

export class RealRedis implements IBaseRedis {
    private redisInstance: RedisInstance;

    constructor(options?: RedisOptions) {
        this.redisInstance = new Redis(options || {});
        this.setupEventListeners();
        bLogger.info('[REDIS] Using real Redis instance');
    }

    private setupEventListeners(): void {
        this.redisInstance.on('connect', () => bLogger.info('[REDIS] Connected'));
        this.redisInstance.on('ready', () => bLogger.info('[REDIS] Ready to use'));
        this.redisInstance.on('error', (err) => bLogger.error('[REDIS] Error:', err));
        this.redisInstance.on('close', () => bLogger.warn('[REDIS] Connection closed'));
        this.redisInstance.on('reconnecting', () => bLogger.info('[REDIS] Reconnecting...'));
    }

    public async get(key: string): Promise<string | null> {
        return this.redisInstance.get(key);
    }

    public async set(key: string, value: string): Promise<string> {
        return this.redisInstance.set(key, value);
    }

    public async del(key: string): Promise<number> {
        return this.redisInstance.del(key);
    }

    public async quit(): Promise<string> {
        return this.redisInstance.quit();
    }
}