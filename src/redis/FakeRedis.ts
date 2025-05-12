import { bLogger } from "../logger";
import { IBaseRedis } from "./iBaseRedis";

export class FakeRedis implements IBaseRedis {
    private store: Record<string, { value: string; expiresAt: number | null }> = {};

    constructor() {
        bLogger.info('[REDIS-FAKE] Using fake Redis instance for testing');
    }

    public async get(key: string): Promise<string | null> {
        bLogger.info(`[REDIS-FAKE] GET called for key: ${key}`);
        const entry = this.store[key];
        if (!entry) return null;

        // Verificar si la clave ha expirado
        if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
            delete this.store[key];
            bLogger.info(`[REDIS-FAKE] Key ${key} has expired`);
            return null;
        }

        return entry.value;
    }

    public async set(key: string, value: string, expireInSeconds?: number): Promise<string> {
        bLogger.info(`[REDIS-FAKE] SET called for key: ${key}, value: ${value}`);
        const expiresAt = expireInSeconds ? Date.now() + expireInSeconds * 1000 : null;
        this.store[key] = { value, expiresAt };
        return 'OK';
    }

    public async del(key: string): Promise<number> {
        bLogger.info(`[REDIS-FAKE] DEL called for key: ${key}`);
        const existed = key in this.store;
        delete this.store[key];
        return existed ? 1 : 0;
    }

    public async quit(): Promise<string> {
        bLogger.info('[REDIS-FAKE] QUIT called');
        return 'OK';
    }

    public async expire(key: string, seconds: number): Promise<number> {
        bLogger.info(`[REDIS-FAKE] EXPIRE called for key: ${key}, seconds: ${seconds}`);
        const entry = this.store[key];
        if (!entry) return 0;

        entry.expiresAt = Date.now() + seconds * 1000;
        return 1;
    }

    public async ttl(key: string): Promise<number> {
        bLogger.info(`[REDIS-FAKE] TTL called for key: ${key}`);
        const entry = this.store[key];
        if (!entry) return -2; // Redis devuelve -2 si la clave no existe

        if (entry.expiresAt === null) return -1; // Redis devuelve -1 si la clave no tiene tiempo de expiración

        const ttl = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
        return ttl;
    }
}