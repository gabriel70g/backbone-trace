import * as winston from "winston";
import * as fs from "fs";
import * as path from "path";
import DailyRotateFile from "winston-daily-rotate-file";

class LoggerConfig {
    private static readonly configPath = path.join(__dirname, "./logConfig.json");

    public static loadLogLevel(): string {
        try {
            if (!fs.existsSync(this.configPath)) {
                bLogger.info("⚠️ Config file not found, creating default config...");
                fs.writeFileSync(this.configPath, JSON.stringify({ level: "info" }, null, 2));
            }
            const config = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
            return config.level || "info";
        } catch (error) {
            bLogger.error("❌ Error loading log level, using default: info");
            return "info";
        }
    }

    public static watchConfigFile(callback: (newLogLevel: string) => void): void {
        fs.watchFile(this.configPath, () => {
            bLogger.info("♻️ Reloading log level from config...");
            const newLogLevel = this.loadLogLevel();
            callback(newLogLevel);
        });
    }
}

class LoggerFactory {
    public static createLogger(logLevel: string): winston.Logger {
        const appName = process.env.APP_NAME || "UnknownApp"; // Obtener el nombre de la aplicación

        const transports: winston.transport[] = [
            new winston.transports.Console(),
        ];

        // Agregar transporte de archivo solo si la variable de entorno está configurada
        if (process.env.ENABLE_FILE_LOGGING === "true") {
            transports.push(
                new DailyRotateFile({
                    filename: "logs/application-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    maxSize: "20m",
                    maxFiles: "14d",
                })
            );
        }

        return winston.createLogger({
            level: logLevel,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const levelUpperCase = level.toUpperCase();
                    return `${timestamp} [${appName}] [${levelUpperCase}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""
                        }`;
                })
            ),
            transports,
        });
    }
}

class LoggerSingleton {
    private static instance: winston.Logger;
    private static logLevel: string = "info";

    private constructor() { }

    public static getLogger(): winston.Logger {
        if (!this.instance) {
            this.logLevel = LoggerConfig.loadLogLevel();
            this.instance = LoggerFactory.createLogger(this.logLevel);

            LoggerConfig.watchConfigFile((newLogLevel) => {
                this.logLevel = newLogLevel;
                this.instance.level = this.logLevel;

                bLogger.info(`✅ Log level updated to: ${this.instance.level}`);
            });
        }
        return this.instance;
    }
}

// Exportar el logger como singleton
export const bLogger = LoggerSingleton.getLogger();