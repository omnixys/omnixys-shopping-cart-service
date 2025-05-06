import { loggerDefaultValue } from './logger.js';
import { nodeConfig } from './node.js';
// import { nodeConfig } from './node';
import { resolve } from 'node:path';
import { type DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './typeormNamingStrategy.js';
import { dbType } from './db.js';
import { BASEDIR, config } from './shopping-cart.js';
import { entities } from '../shopping-cart/model/entity/entities.js';
import { ShoppingCart } from '../shopping-cart/model/entity/shopping-cart.entity.js';

const { db } = config;

// nullish coalescing
const database =
    (db?.database as string | undefined) ?? ShoppingCart.name.toLowerCase();

const host = db?.host as string | undefined;
const username =
    (db?.username as string | undefined) ?? ShoppingCart.name.toLowerCase();
const pass = db?.password as string | undefined;
const passAdmin = db?.passwordAdmin as string | undefined;
const schema = db?.schema as string | undefined;

const namingStrategy = new SnakeNamingStrategy();

const logging =
    (nodeConfig.nodeEnv === 'development' || nodeConfig.nodeEnv === 'test') &&
    !loggerDefaultValue;
const logger = 'advanced-console';

export const dbResourcesDir = resolve(nodeConfig.resourcesDir, 'db', dbType);
console.debug('dbResourcesDir = %s', dbResourcesDir);
console.debug(
    'database=%s, username=%s, password=%s, host=%s, schema=%s',
    database,
    username,
    pass,
    host,
    schema,
);

// TODO records als "deeply immutable data structure" (Stage 2)
// https://github.com/tc39/proposal-record-tuple
let dataSourceOptions: DataSourceOptions;
switch (dbType) {
    case 'postgres': {
        dataSourceOptions = {
            type: 'postgres',
            host,
            port: 5432,
            username,
            password: pass,
            database,
            schema,
            poolSize: 10,
            entities,
            logging,
            logger,
            namingStrategy,
        };
        break;
    }
    case 'mysql': {
        dataSourceOptions = {
            type: 'mysql',
            host,
            port: 3306,
            username,
            password: pass,
            database,
            poolSize: 10,
            entities,
            namingStrategy,
            supportBigNumbers: true,
            //   extra: {
            //     ssl: {
            //       rejectUnauthorized: false,
            //     },
            //   },
        };
        break;
    }
    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    case 'sqlite': {
        const sqliteDatabase = resolve(
            BASEDIR,
            'config',
            'resources',
            'db',
            'sqlite',
            `${database}.sqlite`,
        );
        dataSourceOptions = {
            type: 'better-sqlite3',
            database: sqliteDatabase,
            entities,
            namingStrategy,
            logging,
            logger,
        };
        break;
    }
}
Object.freeze(dataSourceOptions);
export const typeOrmModuleOptions = dataSourceOptions;

export const dbPopulate = db?.populate === true;
let adminDataSourceOptionsTemp: DataSourceOptions | undefined;
if (dbType === 'postgres') {
    adminDataSourceOptionsTemp = {
        type: 'postgres',
        host,
        port: 5432,
        username: 'postgres',
        password: passAdmin,
        database,
        schema,
        namingStrategy,
        logging,
        logger,
        extra: {
            ssl: {
                rejectUnauthorized: false,
            },
        },
    };
} else if (dbType === 'mysql') {
    adminDataSourceOptionsTemp = {
        type: 'mysql',
        host,
        port: 3306,
        username: 'root',
        password: 'p',
        database,
        namingStrategy,
        logging,
        logger,
        supportBigNumbers: true,
        // extra: {
        //   ssl: {
        //     rejectUnauthorized: false,
        //   },
        // },
    };
}
export const adminDataSourceOptions = adminDataSourceOptionsTemp;
