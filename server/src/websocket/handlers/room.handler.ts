import { Server, Socket } from 'socket.io';
import { 
  CLIENT_EVENTS, 
  SERVER_EVENTS, 
  RoleAssignmentSchema, 
  RemoveParticipantSchema,
  SendReactionSchema,
  UpdateSettingsSchema,
  QueueAddSchema,
  QueueRemoveSchema,
  QueuePlayNextSchema, 
  SocketAckResponse 
} from '@watchtogether/shared';
import crypto from 'crypto';
import { RoomManager } from '../room-manager.js';
import { roomService } from '../../modules/rooms/room.service.js';
import { playbackService } from '../../modules/playback/playback.service.js';
import { getRepository } from '../../repositories/index.js';
import { logger } from '../../config/logger.js';

export function registerRoomHandlers(io: Server, socket: Socket, roomManager: RoomManager) {
  // Join Room
  socket.on(CLIENT_EVENTS.JOIN_ROOM, async (data: { roomId: string }, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      if (!data?.roomId) {
        throw new Error('Room ID is required to join');
      }

      const repo = await getRepository();
      const room = await repo.getRoomById(data.roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Check membership
      let participant = await repo.getParticipant(data.roomId, session.userId);
      if (!participant) {
        // User joining via socket: add as participant or host if hostId matches
        const role = session.userId === room.hostId ? 'HOST' : 'PARTICIPANT';
        participant = await repo.addOrUpdateParticipant(
          data.roomId,
          session.userId,
          session.displayName,
          role,
          true
        );
      } else {
        await repo.updateParticipantStatus(data.roomId, session.userId, true);
      }

      // Register with RoomManager
      await roomManager.joinRoom(socket, data.roomId);

      // Get latest authoritative room and playback state
      const currentPlayback = await playbackService.getAuthoritativeState(data.roomId);
      const allParticipants = await repo.getRoomParticipants(data.roomId);
      const queue = await repo.getQueue(data.roomId);

      const roomDetails = {
        ...room,
        playback: currentPlayback,
        participants: allParticipants,
        queue,
      };

      // Notify the joining socket with authoritative state
      socket.emit(SERVER_EVENTS.ROOM_JOINED, {
        room: roomDetails,
        currentRole: participant.role,
      });

      // Broadcast to all other room members that this user joined
      socket.to(data.roomId).emit(SERVER_EVENTS.USER_JOINED, {
        participant,
      });

      logger.info({ roomId: data.roomId, userId: session.userId, role: participant.role }, 'User joined room via WebSocket');
      ack?.({ success: true, data: { room: roomDetails, role: participant.role } });
    } catch (err: any) {
      logger.warn({ err: err.message, socketId: socket.id }, 'Error joining room');
      ack?.({ success: false, error: { code: 'JOIN_ERROR', message: err.message } });
    }
  });

  // Leave Room
  socket.on(CLIENT_EVENTS.LEAVE_ROOM, async (_data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      await roomManager.leaveCurrentRoom(socket);
      ack?.({ success: true });
    } catch (err: any) {
      ack?.({ success: false, error: { code: 'LEAVE_ERROR', message: err.message } });
    }
  });

  // Assign Role
  socket.on(CLIENT_EVENTS.ASSIGN_ROLE, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = RoleAssignmentSchema.parse(data);

      const repo = await getRepository();
      const actor = await repo.getParticipant(parsed.roomId, session.userId);
      if (!actor) {
        throw new Error('You are not a participant in this room');
      }

      const updated = await roomService.assignRole({
        roomId: parsed.roomId,
        actor: { userId: actor.userId, role: actor.role },
        targetUserId: parsed.targetUserId,
        newRole: parsed.role,
      });

      // Broadcast role update to all room members
      io.to(parsed.roomId).emit(SERVER_EVENTS.ROLE_ASSIGNED, {
        targetUserId: updated.userId,
        targetDisplayName: updated.displayName,
        newRole: updated.role,
        assignedBy: session.displayName,
      });

      ack?.({ success: true, data: updated });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Assign role error');
      ack?.({ success: false, error: { code: err.code || 'ASSIGN_ROLE_ERROR', message: err.message } });
    }
  });

  // Remove Participant
  socket.on(CLIENT_EVENTS.REMOVE_PARTICIPANT, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = RemoveParticipantSchema.parse(data);

      const repo = await getRepository();
      const actor = await repo.getParticipant(parsed.roomId, session.userId);
      if (!actor) {
        throw new Error('You are not a participant in this room');
      }

      const removed = await roomService.removeParticipant({
        roomId: parsed.roomId,
        actor: { userId: actor.userId, role: actor.role },
        targetUserId: parsed.targetUserId,
        reason: parsed.reason,
      });

      // Disconnect and un-subscribe removed user through RoomManager
      await roomManager.removeUserFromRoom(parsed.roomId, parsed.targetUserId, parsed.reason);

      ack?.({ success: true, data: removed });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Remove participant error');
      ack?.({ success: false, error: { code: err.code || 'REMOVE_PARTICIPANT_ERROR', message: err.message } });
    }
  });

  // Floating Reactions
  const reactionRateLimits = new Map<string, number[]>();
  socket.on(CLIENT_EVENTS.SEND_REACTION, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = SendReactionSchema.parse(data);

      const now = Date.now();
      const timestamps = reactionRateLimits.get(socket.id) || [];
      const recent = timestamps.filter(t => now - t < 3000);
      if (recent.length >= 10) {
        throw new Error('You are sending reactions too fast');
      }
      recent.push(now);
      reactionRateLimits.set(socket.id, recent);

      const reaction = {
        id: crypto.randomUUID(),
        roomId: parsed.roomId,
        userId: session.userId,
        userName: session.displayName,
        emoji: parsed.emoji,
        timestamp: now,
      };

      io.to(parsed.roomId).emit(SERVER_EVENTS.REACTION_BROADCAST, reaction);
      ack?.({ success: true, data: reaction });
    } catch (err: any) {
      ack?.({ success: false, error: { code: 'REACTION_ERROR', message: err.message } });
    }
  });

  // Update Settings
  socket.on(CLIENT_EVENTS.UPDATE_SETTINGS, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = UpdateSettingsSchema.parse(data);

      const repo = await getRepository();
      const actor = await repo.getParticipant(parsed.roomId, session.userId);
      if (!actor || actor.role !== 'HOST') {
        throw new Error('Only the room Host can update room settings');
      }

      const updated = await roomService.updateSettings({
        roomId: parsed.roomId,
        actor: { userId: actor.userId, role: actor.role },
        settings: {
          controlMode: parsed.controlMode,
          chatEnabled: parsed.chatEnabled,
          participantLimit: parsed.participantLimit,
          isPrivate: parsed.isPrivate,
        },
        name: parsed.name,
      });

      io.to(parsed.roomId).emit(SERVER_EVENTS.SETTINGS_UPDATED, {
        settings: updated.settings,
        name: updated.name,
      });

      ack?.({ success: true, data: updated });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Update settings error');
      ack?.({ success: false, error: { code: 'SETTINGS_ERROR', message: err.message } });
    }
  });

  // Add to Queue
  socket.on(CLIENT_EVENTS.QUEUE_ADD, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = QueueAddSchema.parse(data);

      const repo = await getRepository();
      const actor = await repo.getParticipant(parsed.roomId, session.userId);
      if (!actor) {
        throw new Error('You are not a participant in this room');
      }

      const queue = await roomService.addToQueue({
        roomId: parsed.roomId,
        actor: { userId: actor.userId, displayName: actor.displayName, role: actor.role },
        urlOrId: parsed.urlOrId,
        videoTitle: parsed.videoTitle,
      });

      io.to(parsed.roomId).emit(SERVER_EVENTS.QUEUE_UPDATED, { queue });
      ack?.({ success: true, data: queue });
    } catch (err: any) {
      ack?.({ success: false, error: { code: 'QUEUE_ERROR', message: err.message } });
    }
  });

  // Remove from Queue
  socket.on(CLIENT_EVENTS.QUEUE_REMOVE, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = QueueRemoveSchema.parse(data);

      const repo = await getRepository();
      const actor = await repo.getParticipant(parsed.roomId, session.userId);
      if (!actor) {
        throw new Error('You are not a participant in this room');
      }

      const queue = await roomService.removeFromQueue({
        roomId: parsed.roomId,
        actor: { userId: actor.userId, role: actor.role },
        queueItemId: parsed.queueItemId,
      });

      io.to(parsed.roomId).emit(SERVER_EVENTS.QUEUE_UPDATED, { queue });
      ack?.({ success: true, data: queue });
    } catch (err: any) {
      ack?.({ success: false, error: { code: 'QUEUE_ERROR', message: err.message } });
    }
  });

  // Play next item in Queue
  socket.on(CLIENT_EVENTS.QUEUE_PLAY_NEXT, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = QueuePlayNextSchema.parse(data);

      const repo = await getRepository();
      const actor = await repo.getParticipant(parsed.roomId, session.userId);
      if (!actor) {
        throw new Error('You are not a participant in this room');
      }

      const { nextItem, playback } = await roomService.playNextInQueue({
        roomId: parsed.roomId,
        actor: { userId: actor.userId, role: actor.role },
      });

      const updatedQueue = await repo.getQueue(parsed.roomId);
      io.to(parsed.roomId).emit(SERVER_EVENTS.QUEUE_UPDATED, { queue: updatedQueue });

      if (playback) {
        io.to(parsed.roomId).emit(SERVER_EVENTS.VIDEO_CHANGED, {
          playback,
          actor: {
            userId: session.userId,
            displayName: session.displayName,
            role: actor.role,
          },
        });
      }

      ack?.({ success: true, data: { nextItem, playback, queue: updatedQueue } });
    } catch (err: any) {
      ack?.({ success: false, error: { code: 'QUEUE_ERROR', message: err.message } });
    }
  });

  // Latency & Ping/Pong check
  socket.on(CLIENT_EVENTS.PING, (data: { timestamp: number }, ack?: (res: { clientTimestamp: number; serverTimestamp: number }) => void) => {
    const res = { clientTimestamp: data?.timestamp || Date.now(), serverTimestamp: Date.now() };
    socket.emit(SERVER_EVENTS.PONG, res);
    ack?.(res);
  });

  // Disconnect cleanup
  socket.on('disconnect', async () => {
    reactionRateLimits.delete(socket.id);
    await roomManager.leaveCurrentRoom(socket);
  });
}
