import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';

type EnvGetter = (key: string) => string | undefined;

// Shared by AppModule and the TypeORM CLI (src/data-source.ts)
export function typeOrmOptions(get: EnvGetter): DataSourceOptions {
  return {
    type: 'postgres',
    host: get('DB_HOST') ?? 'localhost',
    port: Number(get('DB_PORT') ?? 5432),
    username: get('DB_USERNAME') ?? 'postgres',
    password: get('DB_PASSWORD') ?? 'postgres',
    database: get('DB_DATABASE') ?? 'inter_api',
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
    // Schema changes go through migrations only
    synchronize: false,
    migrationsRun: true,
    logging: get('NODE_ENV') === 'development',
  };
}
