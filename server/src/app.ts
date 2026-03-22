import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { apiRouter } from './routes';

export const createApp = (): express.Express => {
  const app = express();

  app.use(cors(config.security.cors));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.server.environment
    });
  });

  app.use("/api", apiRouter);

  return app;
};
