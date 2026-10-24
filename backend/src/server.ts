import { app } from './app';
import { config } from './config';
import { up } from './db/migrate';
import { seed } from './db/seed';

async function startServer() {
  try {
    // Run database migrations & seeds automatically on startup
    await up();
    await seed();

    app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`🚀 EDU Food Order Backend Server is running!`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🩺 Health: http://localhost:${config.port}/api/health`);
      console.log(`💼 Environment: ${config.nodeEnv}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
