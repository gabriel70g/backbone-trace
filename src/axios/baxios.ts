import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { bLogger } from '../logger';

export interface BackboneAxiosConfig extends AxiosRequestConfig {
    timeout?: number; // Timeout en milisegundos
}

export class Baxios {
    private defaultTimeout: number;

    constructor(defaultTimeout: number = 3000) {
        this.defaultTimeout = defaultTimeout;
    }

    createInstance(config: BackboneAxiosConfig = {}): AxiosInstance {
        const instance = axios.create({
            ...config,
            timeout: config.timeout ?? this.defaultTimeout,
        });
        this.setupInterceptors(instance);

        return instance;
    }

    private setupInterceptors(instance: AxiosInstance): void {

        // Request Interceptor
        instance.interceptors.request.use((config) => {
            if (!config.headers) {
                config.headers = new axios.AxiosHeaders();
            }

            // Normalizar y manejar el header `x-trace-id`
            let traceIdHeader: string | undefined;

            for (const key in config.headers) {
                if (key.toLowerCase() === 'x-trace-id') {
                    traceIdHeader = config.headers[key] as string;
                    break;
                }
            }

            const traceId = traceIdHeader ?? uuidv4();
            config.headers['x-trace-id'] = traceId;

            bLogger.info(`[REQUEST] [${config.method?.toUpperCase()}] ${config.url} - traceId: ${traceId}`);

            return config;
        });

        // Response Interceptor
        instance.interceptors.response.use(
            (response) => {
                if (process.env.NODE_TEST === 'true') {
                    bLogger.info(`[TEST MODE] Generic response for testing`);
                    return {
                        data: { message: 'Test mode response' },
                        status: 200,
                        statusText: 'OK',
                        headers: response.headers,
                        config: response.config,
                    };
                }

                bLogger.info(`[RESPONSE] [${response.status}] ${response.config.url}`);
                return response;
            },
            (error) => this.handleError(error)
        );
    }

    private handleError(error: AxiosError): Promise<never> {
        const traceId = error.config?.headers?.['x-trace-id'] as string | undefined;

        if (process.env.NODE_TEST === 'true') {
            bLogger.error(`[TEST MODE] Generic error for testing`);
            return Promise.reject({
                message: 'Test mode error',
                config: error.config,
                code: error.code,
                response: {
                    status: 500,
                    statusText: 'Internal Server Error',
                },
            });
        }

        if (error.code === 'ECONNABORTED') {
            bLogger.error(`[TIMEOUT ERROR] ${error.config?.url} - traceId: ${traceId} - Request timed out`);
        } else if (error.response) {
            bLogger.error(`[RESPONSE ERROR] [${error.response.status}] ${error.config?.url} - traceId: ${traceId} - ${error.message}`);
        } else {
            bLogger.error(`[UNKNOWN ERROR] ${error.config?.url} - traceId: ${traceId} - ${error.message}`);
        }

        return Promise.reject(error);
    }
}