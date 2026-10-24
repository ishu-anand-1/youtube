import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttpPkg from 'pino-http';
const pinoHttp = ((pinoHttpPkg as any).default || pinoHttpPkg) as any;
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { globalLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authRouter } from './modules/auth/auth.controller.js';
import { roomRouter } from './modules/rooms/room.controller.js';
import { getRepository } from './repositories/index.js';

export function createApp() {
  const app = express();

  // Trust reverse proxy (Nginx / Render / Railway)
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS
  const allowedOrigins = env.FRONTEND_ORIGIN.split(',').map((o) => o.trim());
  const isAllowedOrigin = (origin?: string): boolean => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
    if (env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
    return false;
  };

  app.use(cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin }, 'CORS request rejected for origin');
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
  }));

  // Logging & Body Parsers
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(globalLimiter);

  // Health check endpoints
  app.get('/health/live', (_req, res) => {
    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: Date.now(),
      service: 'watchtogether-server',
    });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      const repo = await getRepository();
      // Simple health ping to storage
      await repo.getRoomByCode('HEALTH_CHECK_TEST');
      res.json({
        status: 'READY',
        uptime: process.uptime(),
        timestamp: Date.now(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'NOT_READY',
        error: err.message,
      });
    }
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/rooms', roomRouter);

  // 404 Handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
