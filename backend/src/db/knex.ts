import knex, { Knex } from 'knex';
import { config } from '../config';

const isSqlite = config.db.client === 'sqlite3';

const knexConfig: Knex.Config = isSqlite
  ? {
      client: 'sqlite3',
      connection: {
        filename: config.db.filename,
      },
      useNullAsDefault: true,
      pool: {
        afterCreate: (conn: any, cb: any) => {
          conn.run('PRAGMA foreign_keys = ON', cb);
        },
      },
    }
  : {
      client: 'pg',
      connection: {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
      },
      pool: {
        min: 2,
        max: 10,
      },
    };

export const db = knex(knexConfig);
