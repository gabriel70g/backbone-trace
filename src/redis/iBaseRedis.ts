export interface IBaseRedis {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<string>;
    del(key: string): Promise<number>;
    quit(): Promise<string>;
}