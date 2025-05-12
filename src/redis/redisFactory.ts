// necesito que si la variale de entorno REDIS_TEST es true, use la clase FakeRedis, y si no, use la clase RealRedis.
import { bLogger } from '../logger';
import { IBaseRedis } from './iBaseRedis';
import { FakeRedis } from './FakeRedis';
import { RealRedis } from './RealRedis';



export class RedisFactory {
    private static instance: IBaseRedis | null;

    public static getInstance(): IBaseRedis {
        if (!this.instance) {
            this.instance = process.env.REDIS_TEST ? new FakeRedis() : new RealRedis();
        }
        return this.instance;
    }

    public static async close(): Promise<void> {
        if (this.instance) {
            await this.instance.quit();
            this.instance = null;
        }
    }
}