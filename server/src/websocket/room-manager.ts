import { Server, Socket } from 'socket.io';
import { SERVER_EVENTS } from '@watchtogether/shared';
import { getRepository } from '../repositories/index.js';
import { logger } from '../config/logger.js';

export class RoomManager {
  // roomId -> Set of socket IDs
  private roomSockets = new Map<string, Set<string>>();
  // socketId -> roomId
  private socketRoomMap = new Map<string, string>();
  // userId -> Set of active socket IDs
  private userSockets = new Map<string, Set<string>>();

  constructor(private io: Server) {}

  async joinRoom(socket: Socket, roomId: string): Promise<void> {
    const session = socket.session;
    if (!session) return;

    // Leave any previous room
    await this.leaveCurrentRoom(socket);

    socket.join(roomId);
    socket.currentRoomId = roomId;
    this.socketRoomMap.set(socket.id, roomId);

    let roomSet = this.roomSockets.get(roomId);
    if (!roomSet) {
      roomSet = new Set();
      this.roomSockets.set(roomId, roomSet);
    }
    roomSet.add(socket.id);

    let userSet = this.userSockets.get(session.userId);
    if (!userSet) {
      userSet = new Set();
      this.userSockets.set(session.userId, userSet);
    }
    userSet.add(socket.id);

    // Update status in repository
    const repo = await getRepository();
    await repo.updateParticipantStatus(roomId, session.userId, true);

    logger.debug({ roomId, userId: session.userId, socketId: socket.id }, 'Socket registered in room');
  }

  async leaveCurrentRoom(socket: Socket): Promise<void> {
    const roomId = this.socketRoomMap.get(socket.id);
    const session = socket.session;
    if (!roomId || !session) return;

    socket.leave(roomId);
    this.socketRoomMap.delete(socket.id);
    delete socket.currentRoomId;

    const roomSet = this.roomSockets.get(roomId);
    if (roomSet) {
      roomSet.delete(socket.id);
      if (roomSet.size === 0) {
        this.roomSockets.delete(roomId);
      }
    }

    const userSet = this.userSockets.get(session.userId);
    if (userSet) {
      userSet.delete(socket.id);
      if (userSet.size === 0) {
        this.userSockets.delete(session.userId);
        // All sockets for this user in this room are gone -> mark offline
        const repo = await getRepository();
        await repo.updateParticipantStatus(roomId, session.userId, false);

        // Notify room members
        this.io.to(roomId).emit(SERVER_EVENTS.USER_LEFT, {
          userId: session.userId,
          displayName: session.displayName,
        });

        logger.info({ roomId, userId: session.userId }, 'User went offline from room');
      }
    }
  }

  async removeUserFromRoom(roomId: string, userId: string, reason?: string): Promise<void> {
    const userSet = this.userSockets.get(userId);
    if (userSet) {
      for (const socketId of userSet) {
        const targetSocket = this.io.sockets.sockets.get(socketId);
        if (targetSocket && targetSocket.currentRoomId === roomId) {
          targetSocket.leave(roomId);
          this.socketRoomMap.delete(socketId);
          delete targetSocket.currentRoomId;

          targetSocket.emit(SERVER_EVENTS.PARTICIPANT_REMOVED, {
            targetUserId: userId,
            targetDisplayName: targetSocket.session?.displayName || 'You',
            reason: reason || 'Removed by host',
          });
        }
      }
      this.userSockets.delete(userId);
    }

    // Broadcast to remaining room members
    this.io.to(roomId).emit(SERVER_EVENTS.PARTICIPANT_REMOVED, {
      targetUserId: userId,
      reason,
    });
  }

  getActiveRoomIds(): string[] {
    return Array.from(this.roomSockets.keys());
  }

  getRoomSocketCount(roomId: string): number {
    return this.roomSockets.get(roomId)?.size || 0;
  }
}
