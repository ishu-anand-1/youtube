import { Socket } from 'socket.io';
import { UserSession } from '@watchtogether/shared';
import { authService } from '../modules/auth/auth.service.js';
import { logger } from '../config/logger.js';

declare module 'socket.io' {
  interface Socket {
    session?: UserSession;
    currentRoomId?: string;
  }
}

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
  try {
    // 1. Check handshake auth object (e.g. { token: '...' })
    let token = socket.handshake.auth?.token;

    // 2. Check query string
    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token as string;
    }

    // 3. Check Cookie header
    if (!token && socket.handshake.headers.cookie) {
      const match = socket.handshake.headers.cookie.match(/wt_session=([^;]+)/);
      if (match && match[1]) {
        token = match[1];
      }
    }

    if (!token) {
      logger.debug('Socket connection rejected: No authentication token provided');
      return next(new Error('Authentication token required'));
    }

    const session = await authService.validateToken(token);
    if (!session) {
      logger.debug('Socket connection rejected: Invalid or expired token');
      return next(new Error('Invalid or expired authentication session'));
    }

    socket.session = session;
    logger.debug({ userId: session.userId, socketId: socket.id }, 'Socket successfully authenticated');
    next();
  } catch (err) {
    logger.error({ err }, 'Error during socket authentication handshake');
    next(new Error('Authentication handshake failed'));
  }
}
