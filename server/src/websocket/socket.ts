import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import ioredisPkg from 'ioredis';
const Redis = ((ioredisPkg as any).default || (ioredisPkg as any).Redis || ioredisPkg) as any;
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { socketAuthMiddleware } from './middleware.js';
import { RoomManager } from './room-manager.js';
import { SyncEngine } from './sync-engine.js';
import { registerPlaybackHandlers } from './handlers/playback.handler.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerRequestHandlers } from './handlers/request.handler.js';
import { registerChatHandlers } from './handlers/chat.handler.js';

export function initializeWebSocket(httpServer: HttpServer): {
  io: SocketIOServer;
  roomManager: RoomManager;
  syncEngine: SyncEngine;
} {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 10000,
    maxHttpBufferSize: 1e6, // 1MB max payload
  });

  // Setup Redis Adapter if REDIS_URL is provided for horizontal multi-instance scaling
  if (env.REDIS_URL) {
    try {
      const pubClient = new Redis(env.REDIS_URL);
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err: any) => logger.warn({ err: err?.message || err }, 'Redis Pub Client Error'));
      subClient.on('error', (err: any) => logger.warn({ err: err?.message || err }, 'Redis Sub Client Error'));

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO configured with Redis Adapter for multi-instance clustering');
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize Redis Adapter; falling back to in-memory adapter');
    }
  } else {
    logger.info('Running with in-memory Socket.IO adapter (single instance mode)');
  }

  // Socket Authentication Middleware
  io.use(socketAuthMiddleware);

  const roomManager = new RoomManager(io);
  const syncEngine = new SyncEngine(io, roomManager);
  syncEngine.start();

  // Connection Handler
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id, user: socket.session?.displayName }, 'Client connected to WebSocket');

    registerRoomHandlers(io, socket, roomManager);
    registerPlaybackHandlers(io, socket);
    registerRequestHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return { io, roomManager, syncEngine };
}
