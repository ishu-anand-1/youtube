import http from 'http';
import { createApp } from './app.js';
import { initializeWebSocket } from './websocket/socket.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { getRepository } from './repositories/index.js';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize storage repository
  await getRepository();

  // Initialize WebSockets
  const { io, syncEngine } = initializeWebSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`🚀 WatchTogether server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`📡 Allowed Frontend Origins: ${env.FRONTEND_ORIGIN}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} signal received: closing HTTP server and WebSocket connections`);
    syncEngine.stop();

    io.close(() => {
      logger.info('WebSocket server closed');
    });

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10s if hanging
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start WatchTogether server');
  process.exit(1);
});
