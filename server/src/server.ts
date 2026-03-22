import { config } from '@/config/index.js';
import { db } from '@/db/index.js';
import { createApp } from '@/app.js';

export const startServer = async () => {
  try {
    await db.execute('SELECT 1');
    console.log('Database connected successfully');

    const app = createApp();

    app.listen(config.server.port, config.server.host, () => {
      console.log(`Server running on http://${config.server.host}:${config.server.port}`);
      console.log(`Environment: ${config.server.environment}`);
      console.log(`Health check: http://${config.server.host}:${config.server.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
