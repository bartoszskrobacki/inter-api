import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from './database/typeorm-options';

config({ quiet: true });

// Used by the TypeORM CLI, see migration:* scripts in package.json
export default new DataSource(typeOrmOptions((key) => process.env[key]));
