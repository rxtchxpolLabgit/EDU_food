import dotenv from 'dotenv';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'local-development-only-change-this-secret';
const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@EduFood2026';
if (process.env.NODE_ENV === 'production') {
  if (jwtSecret === 'local-development-only-change-this-secret' || jwtSecret.length < 32) {
    throw new Error('Production requires JWT_SECRET with at least 32 characters');
  }
  if (!process.env.ADMIN_DEFAULT_PASSWORD || adminDefaultPassword === 'Admin@EduFood2026') {
    throw new Error('Production requires a unique ADMIN_DEFAULT_PASSWORD');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    client: process.env.DB_CLIENT || 'sqlite3',
    filename: process.env.DB_FILENAME || './edu_food.sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'edufood',
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: '7d',
  },
  adminDefaultPassword,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
