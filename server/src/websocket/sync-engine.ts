import { Server } from 'socket.io';
import { SERVER_EVENTS } from '@watchtogether/shared';
import { RoomManager } from './room-manager.js';
import { playbackService } from '../modules/playback/playback.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class SyncEngine {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private io: Server,
    private roomManager: RoomManager
  ) {}

  start(): void {
    if (this.intervalId) return;

    logger.info({ intervalMs: env.SYNC_INTERVAL_MS }, 'Starting authoritative synchronization engine');

    this.intervalId = setInterval(async () => {
      try {
        const activeRooms = this.roomManager.getActiveRoomIds();
        for (const roomId of activeRooms) {
          try {
            const authoritative = await playbackService.getAuthoritativeState(roomId);
            
            // Only broadcast heartbeat if there are active sockets in the room
            if (this.roomManager.getRoomSocketCount(roomId) > 0) {
              this.io.to(roomId).emit(SERVER_EVENTS.SYNC_STATE, {
                playback: authoritative,
                serverTime: Date.now(),
              });
            }
          } catch (err) {
            logger.debug({ roomId, err: (err as Error).message }, 'Sync heartbeat skipped for room');
          }
        }
      } catch (globalErr) {
        logger.error({ err: globalErr }, 'Error in synchronization heartbeat cycle');
      }
    }, env.SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Synchronization engine stopped');
    }
  }
}
