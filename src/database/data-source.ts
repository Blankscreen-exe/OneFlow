import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';

const config = getDatabaseConfig();

// Build DataSource options based on config
const dataSourceOptions: any = {
  type: config.type,
  entities: config.entities as string[],
  migrations: config.migrations as string[],
  synchronize: false, // Always false for migrations
  logging: true,
};

// Handle URL-based connections (PostgreSQL/MySQL) vs file-based (SQLite)
if ((config as any).url) {
  dataSourceOptions.url = (config as any).url;
} else {
  dataSourceOptions.database = config.database;
}

export default new DataSource(dataSourceOptions);

