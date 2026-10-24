import crypto from 'crypto';
import { 
  RoomDetails, 
  RoomParticipant, 
  RoomRole, 
  UserSession, 
  extractYouTubeVideoId 
} from '@watchtogether/shared';
import { getRepository } from '../../repositories/index.js';
import { permissionService } from '../roles/permission.service.js';
import { RoomNotFoundError, NotFoundError } from '../../errors/index.js';
import { logger } from '../../config/logger.js';

// Clean character set for room codes (omits ambiguous 0, O, 1, I)
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export class RoomService {
  private generateRoomCode(): string {
    let result = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      result += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    }
    return result;
  }

  async createRoom(params: {
    name?: string;
    videoUrl?: string;
    isPrivate?: boolean;
    session: UserSession;
  }): Promise<RoomDetails> {
    const repo = await getRepository();
    const code = this.generateRoomCode();
    const roomName = params.name?.trim() || `${params.session.displayName}'s Watch Party`;
    
    // Default video: Lofi Girl Chill Beats
    let videoId = 'jfKfPfyJRdk';
    let videoTitle = 'Lofi Hip Hop Radio - Beats to Relax/Study to';
    if (params.videoUrl) {
      const parsed = extractYouTubeVideoId(params.videoUrl);
      if (parsed) {
        videoId = parsed;
        videoTitle = 'Selected YouTube Video';
      }
    }

    const room = await repo.createRoom({
      code,
      name: roomName,
      hostId: params.session.userId,
      hostDisplayName: params.session.displayName,
      hostAvatarColor: params.session.avatarColor,
      videoId,
      videoTitle,
      settings: {
        controlMode: 'HOST_ONLY',
        chatEnabled: true,
        participantLimit: 50,
        isPrivate: params.isPrivate || false,
      },
    });

    logger.info({ roomId: room.id, code: room.code, hostId: params.session.userId }, 'Room created successfully');
    return room;
  }

  async getRoom(roomId: string): Promise<RoomDetails | null> {
    const repo = await getRepository();
    return repo.getRoomById(roomId);
  }

  async getRoomByCode(code: string): Promise<RoomDetails | null> {
    const repo = await getRepository();
    return repo.getRoomByCode(code.toUpperCase());
  }

  async joinRoom(params: {
    roomCode: string;
    session: UserSession;
    avatarColor?: string;
  }): Promise<{ room: RoomDetails; participant: RoomParticipant }> {
    const repo = await getRepository();
    const room = await repo.getRoomByCode(params.roomCode.toUpperCase());
    if (!room) {
      throw new RoomNotFoundError('Room not found with this code');
    }

    // Check if user is already a member
    const existing = await repo.getParticipant(room.id, params.session.userId);
    let role: RoomRole = 'PARTICIPANT';

    if (existing) {
      role = existing.role; // Retain existing role
    } else if (params.session.userId === room.hostId) {
      role = 'HOST';
    }

    const participant = await repo.addOrUpdateParticipant(
      room.id,
      params.session.userId,
      params.session.displayName,
      role,
      true,
      params.avatarColor || params.session.avatarColor
    );

    const updatedRoom = await repo.getRoomById(room.id);
    return { room: updatedRoom!, participant };
  }

  async updateSettings(params: {
    roomId: string;
    actor: { userId: string; role: RoomRole };
    settings: {
      controlMode?: 'HOST_ONLY' | 'ALL';
      chatEnabled?: boolean;
      participantLimit?: number;
      isPrivate?: boolean;
    };
    name?: string;
  }): Promise<RoomDetails> {
    if (params.actor.role !== 'HOST') {
      throw new Error('Only the room Host can modify room settings');
    }
    const repo = await getRepository();
    return repo.updateRoomSettings(params.roomId, params.settings, params.name);
  }

  async closeRoom(params: {
    roomId: string;
    actor: { userId: string; role: RoomRole };
  }): Promise<void> {
    if (params.actor.role !== 'HOST') {
      throw new Error('Only the room Host can close the room');
    }
    const repo = await getRepository();
    await repo.deleteRoom(params.roomId);
    logger.info({ roomId: params.roomId, hostId: params.actor.userId }, 'Room closed by host');
  }

  async addToQueue(params: {
    roomId: string;
    actor: { userId: string; displayName: string; role: RoomRole };
    urlOrId: string;
    videoTitle?: string;
  }) {
    const videoId = extractYouTubeVideoId(params.urlOrId);
    if (!videoId) {
      throw new Error('Invalid YouTube video URL or ID');
    }
    const repo = await getRepository();
    const existingQueue = await repo.getQueue(params.roomId);

    const queueItem = {
      id: crypto.randomUUID(),
      roomId: params.roomId,
      videoId,
      videoTitle: params.videoTitle || 'YouTube Video',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      addedById: params.actor.userId,
      addedByName: params.actor.displayName,
      order: existingQueue.length + 1,
      createdAt: Date.now(),
    };

    return repo.addQueueItem(queueItem);
  }

  async removeFromQueue(params: {
    roomId: string;
    actor: { userId: string; role: RoomRole };
    queueItemId: string;
  }) {
    if (params.actor.role !== 'HOST' && params.actor.role !== 'MODERATOR') {
      throw new Error('Only Host or Moderator can remove items from queue');
    }
    const repo = await getRepository();
    return repo.removeQueueItem(params.roomId, params.queueItemId);
  }

  async playNextInQueue(params: {
    roomId: string;
    actor: { userId: string; role: RoomRole };
  }) {
    if (params.actor.role !== 'HOST' && params.actor.role !== 'MODERATOR') {
      throw new Error('Only Host or Moderator can advance the queue');
    }
    const repo = await getRepository();
    return repo.playNextQueueItem(params.roomId);
  }

  async assignRole(params: {
    roomId: string;
    actor: { userId: string; role: RoomRole };
    targetUserId: string;
    newRole: RoomRole;
  }): Promise<RoomParticipant> {
    const repo = await getRepository();
    const target = await repo.getParticipant(params.roomId, params.targetUserId);
    if (!target) {
      throw new NotFoundError('Target participant not found in room');
    }

    permissionService.assertCanAssignRole(params.actor.role, target.role, params.newRole);

    await repo.updateParticipantRole(params.roomId, params.targetUserId, params.newRole);
    target.role = params.newRole;

    return target;
  }

  async removeParticipant(params: {
    roomId: string;
    actor: { userId: string; role: RoomRole };
    targetUserId: string;
    reason?: string;
  }): Promise<RoomParticipant> {
    const repo = await getRepository();
    const target = await repo.getParticipant(params.roomId, params.targetUserId);
    if (!target) {
      throw new NotFoundError('Target participant not found in room');
    }

    permissionService.assertCanRemoveParticipant(params.actor.role, target.role);

    await repo.removeParticipant(params.roomId, params.targetUserId);

    logger.info({
      roomId: params.roomId,
      targetUserId: params.targetUserId,
      reason: params.reason,
    }, 'Participant removed by host');

    return target;
  }
}

export const roomService = new RoomService();
