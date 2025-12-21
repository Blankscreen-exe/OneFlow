import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Control synchronize behavior
  // Set DB_SYNCHRONIZE=true to enable (default: false for safety)
  // Set DROP_SCHEMA=true to drop and recreate schema (use with caution!)
  const synchronize = process.env.DB_SYNCHRONIZE === 'true' && nodeEnv === 'development';
  const dropSchema = process.env.DROP_SCHEMA === 'true' && nodeEnv === 'development';

  // If DATABASE_URL is provided, use it (PostgreSQL/MySQL)
  if (databaseUrl) {
    // Parse DATABASE_URL
    const url = new URL(databaseUrl);
    const isPostgres = url.protocol === 'postgres:' || url.protocol === 'postgresql:';
    const isMysql = url.protocol === 'mysql:';

    if (isPostgres) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
        migrations: [join(__dirname, '..', 'database', 'migrations', '*.{.ts,.js}')],
        synchronize,
        dropSchema,
        logging: nodeEnv === 'development',
        ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
      };
    }

    if (isMysql) {
      return {
        type: 'mysql',
        url: databaseUrl,
        entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
        migrations: [join(__dirname, '..', 'database', 'migrations', '*.{.ts,.js}')],
        synchronize,
        dropSchema,
        logging: nodeEnv === 'development',
      };
    }
  }

  // Fallback to SQLite if DATABASE_URL is not provided
  // SQLite is safer to synchronize by default in development
  return {
    type: 'sqlite',
    database: join(process.cwd(), 'database.sqlite'),
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{.ts,.js}')],
    synchronize: nodeEnv === 'development', // SQLite is safe to sync by default
    dropSchema,
    logging: nodeEnv === 'development',
  };
};

