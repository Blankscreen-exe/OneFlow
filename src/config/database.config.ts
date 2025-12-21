import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';

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
        synchronize: nodeEnv === 'development',
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
        synchronize: nodeEnv === 'development',
        logging: nodeEnv === 'development',
      };
    }
  }

  // Fallback to SQLite if DATABASE_URL is not provided
  return {
    type: 'sqlite',
    database: join(process.cwd(), 'database.sqlite'),
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{.ts,.js}')],
    synchronize: nodeEnv === 'development',
    logging: nodeEnv === 'development',
  };
};

