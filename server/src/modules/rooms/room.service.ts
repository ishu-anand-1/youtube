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
    session: UserSession;
  }): Promise<RoomDetails> {
    const repo = await getRepository();
    const code = this.generateRoomCode();
    const roomName = params.name?.trim() || `${params.session.displayName}'s Watch Party`;
    
    // Default video: Lofi Girl or Rick Astley or user input
    let videoId = 'jfKfPfyJRdk'; // Lofi Girl Chill Beats
    if (params.videoUrl) {
      const parsed = extractYouTubeVideoId(params.videoUrl);
      if (parsed) {
        videoId = parsed;
      }
    }

    const room = await repo.createRoom({
      code,
      name: roomName,
      hostId: params.session.userId,
      hostDisplayName: params.session.displayName,
      videoId,
      videoTitle: 'Welcome to WatchTogether',
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
  }): Promise<{ room: RoomDetails; participant: RoomParticipant }> {
    const repo = await getRepository();
    const room = await repo.getRoomByCode(params.roomCode.toUpperCase());
    if (!room) {
      throw new Error('Room not found or code is invalid');
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
      true
    );

    const updatedRoom = await repo.getRoomById(room.id);
    return { room: updatedRoom!, participant };
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
      throw new Error('Target participant not found in room');
    }

    permissionService.assertCanAssignRole(params.actor.role, target.role, params.newRole);

    await repo.updateParticipantRole(params.roomId, params.targetUserId, params.newRole);
    target.role = params.newRole;

    logger.info({
      roomId: params.roomId,
      targetUserId: params.targetUserId,
      newRole: params.newRole,
    }, 'Participant role updated');

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
      throw new Error('Target participant not found in room');
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
