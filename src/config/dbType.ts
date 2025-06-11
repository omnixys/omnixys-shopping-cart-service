import { config } from './app.js';

const dbConfig = config.db;

type DbType = 'postgres' | 'mysql' | 'sqlite';

const type: DbType | undefined = dbConfig?.type;

export const dbType =
    type === 'postgres' || type === 'mysql' || type === 'sqlite'
        ? type
        : 'postgres';
