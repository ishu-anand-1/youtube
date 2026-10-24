import { PrismaClient, Role as PrismaRole, PlaybackStatus as PrismaStatus, ActionType as PrismaAction, RequestStatus as PrismaReqStatus } from '@prisma/client';
import { 
  ActionRequest, 
  ChatMessage, 
  PlaybackState, 
  QueueItem,
  RoomDetails, 
  RoomParticipant, 
  RoomRole, 
  RoomSettings,
  UserSession 
} from '@watchtogether/shared';
import { IRepository } from './interfaces.js';
import { logger } from '../config/logger.js';

export class PrismaRepository implements IRepository {
  private prisma: PrismaClient;
  private queues = new Map<string, QueueItem[]>();
  private settings = new Map<string, RoomSettings>();
  private avatarColors = new Map<string, string>();

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async createSession(displayName: string, token: string, tokenHash: string, avatarColor?: string): Promise<UserSession> {
    const record = await this.prisma.userSession.create({
      data: {
        displayName,
        sessionTokenHash: tokenHash,
      },
    });

    if (avatarColor) {
      this.avatarColors.set(record.id, avatarColor);
    }

    return {
      userId: record.id,
      displayName: record.displayName,
      avatarColor: avatarColor || '#6366F1',
      token,
      createdAt: record.createdAt.getTime(),
    };
  }

  async findSessionByTokenHash(tokenHash: string): Promise<UserSession | null> {
    const record = await this.prisma.userSession.findUnique({
      where: { sessionTokenHash: tokenHash },
    });
    if (!record) return null;

    return {
      userId: record.id,
      displayName: record.displayName,
      avatarColor: this.avatarColors.get(record.id) || '#6366F1',
      token: '', // Never return raw token from hash
      createdAt: record.createdAt.getTime(),
    };
  }

  async updateSessionActivity(userId: string): Promise<void> {
    try {
      await this.prisma.userSession.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
    } catch {
      // Non-critical background ping
    }
  }

  async createRoom(params: {
    code: string;
    name: string;
    hostId: string;
    hostDisplayName: string;
    hostAvatarColor?: string;
    videoId: string;
    videoTitle?: string;
    settings?: RoomSettings;
  }): Promise<RoomDetails> {
    const now = Date.now();

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          code: params.code.toUpperCase(),
          name: params.name,
          hostId: params.hostId,
        },
      });

      const playback = await tx.playbackState.create({
        data: {
          roomId: room.id,
          videoId: params.videoId,
          videoTitle: params.videoTitle || 'YouTube Video',
          status: PrismaStatus.PAUSED,
          position: 0,
          serverTimestamp: BigInt(now),
          version: 1,
          updatedBy: params.hostDisplayName,
        },
      });

      const membership = await tx.roomMembership.create({
        data: {
          roomId: room.id,
          userId: params.hostId,
          role: PrismaRole.HOST,
          isOnline: true,
        },
      });

      return { room, playback, membership };
    });

    const roomSettings: RoomSettings = params.settings || {
      controlMode: 'HOST_ONLY',
      chatEnabled: true,
      participantLimit: 50,
      isPrivate: false,
    };

    this.settings.set(result.room.id, roomSettings);
    this.queues.set(result.room.id, []);
    if (params.hostAvatarColor) {
      this.avatarColors.set(params.hostId, params.hostAvatarColor);
    }

    return {
      id: result.room.id,
      code: result.room.code,
      name: result.room.name,
      hostId: result.room.hostId,
      createdAt: result.room.createdAt.getTime(),
      playback: {
        videoId: result.playback.videoId,
        videoTitle: result.playback.videoTitle || undefined,
        status: result.playback.status as PlaybackState['status'],
        position: result.playback.position,
        timestamp: Number(result.playback.serverTimestamp),
        version: result.playback.version,
        updatedBy: result.playback.updatedBy,
      },
      participants: [{
        id: result.membership.id,
        userId: params.hostId,
        displayName: params.hostDisplayName,
        avatarColor: params.hostAvatarColor || this.avatarColors.get(params.hostId) || '#6366F1',
        role: 'HOST',
        isOnline: true,
        joinedAt: result.membership.joinedAt.getTime(),
      }],
      queue: [],
      settings: roomSettings,
    };
  }

  async getRoomById(id: string): Promise<RoomDetails | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        playback: true,
        memberships: {
          include: { user: true },
        },
      },
    });

    if (!room || !room.playback) return null;

    const queue = this.queues.get(id) || [];
    const settings = this.settings.get(id) || {
      controlMode: 'HOST_ONLY',
      chatEnabled: true,
      participantLimit: 50,
      isPrivate: false,
    };

    return {
      id: room.id,
      code: room.code,
      name: room.name,
      hostId: room.hostId,
      createdAt: room.createdAt.getTime(),
      playback: {
        videoId: room.playback.videoId,
        videoTitle: room.playback.videoTitle || undefined,
        status: room.playback.status as PlaybackState['status'],
        position: room.playback.position,
        timestamp: Number(room.playback.serverTimestamp),
        version: room.playback.version,
        updatedBy: room.playback.updatedBy,
      },
      participants: room.memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.user.displayName,
        avatarColor: this.avatarColors.get(m.userId) || '#6366F1',
        role: m.role as RoomRole,
        isOnline: m.isOnline,
        joinedAt: m.joinedAt.getTime(),
      })),
      queue,
      settings,
    };
  }

  async getRoomByCode(code: string): Promise<RoomDetails | null> {
    const room = await this.prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true },
    });
    if (!room) return null;
    return this.getRoomById(room.id);
  }

  async updateRoomSettings(roomId: string, newSettings: Partial<RoomSettings>, name?: string): Promise<RoomDetails> {
    const existing = this.settings.get(roomId) || {
      controlMode: 'HOST_ONLY',
      chatEnabled: true,
      participantLimit: 50,
      isPrivate: false,
    };
    const updated = { ...existing, ...newSettings };
    this.settings.set(roomId, updated);

    if (name) {
      await this.prisma.room.update({
        where: { id: roomId },
        data: { name },
      });
    }

    return (await this.getRoomById(roomId))!;
  }

  async deleteRoom(id: string): Promise<void> {
    this.queues.delete(id);
    this.settings.delete(id);
    await this.prisma.room.delete({
      where: { id },
    });
  }

  async addOrUpdateParticipant(
    roomId: string, 
    userId: string, 
    displayName: string, 
    role: RoomRole, 
    isOnline: boolean,
    avatarColor?: string
  ): Promise<RoomParticipant> {
    if (avatarColor) {
      this.avatarColors.set(userId, avatarColor);
    }

    const membership = await this.prisma.roomMembership.upsert({
      where: {
        roomId_userId: { roomId, userId },
      },
      update: {
        isOnline,
      },
      create: {
        roomId,
        userId,
        role: role as PrismaRole,
        isOnline,
      },
      include: {
        user: true,
      },
    });

    return {
      id: membership.id,
      userId: membership.userId,
      displayName: membership.user?.displayName || displayName,
      avatarColor: avatarColor || this.avatarColors.get(userId) || '#6366F1',
      role: membership.role as RoomRole,
      isOnline: membership.isOnline,
      joinedAt: membership.joinedAt.getTime(),
    };
  }

  async getQueue(roomId: string): Promise<QueueItem[]> {
    return this.queues.get(roomId) || [];
  }

  async addQueueItem(item: QueueItem): Promise<QueueItem[]> {
    let queue = this.queues.get(item.roomId);
    if (!queue) {
      queue = [];
      this.queues.set(item.roomId, queue);
    }
    queue.push(item);
    return queue;
  }

  async removeQueueItem(roomId: string, itemId: string): Promise<QueueItem[]> {
    let queue = this.queues.get(roomId);
    if (!queue) return [];
    queue = queue.filter((i) => i.id !== itemId);
    this.queues.set(roomId, queue);
    return queue;
  }

  async playNextQueueItem(roomId: string): Promise<{ nextItem: QueueItem | null; playback: PlaybackState | null }> {
    let queue = this.queues.get(roomId);
    if (!queue || queue.length === 0) {
      const current = await this.getPlaybackState(roomId);
      return { nextItem: null, playback: current };
    }
    const nextItem = queue.shift()!;
    this.queues.set(roomId, queue);

    const current = await this.getPlaybackState(roomId);
    const playback: PlaybackState = {
      videoId: nextItem.videoId,
      videoTitle: nextItem.videoTitle,
      status: 'PLAYING',
      position: 0,
      timestamp: Date.now(),
      version: (current?.version || 1) + 1,
      updatedBy: nextItem.addedByName,
    };
    await this.updatePlaybackState(roomId, playback);
    return { nextItem, playback };
  }

  async getParticipant(roomId: string, userId: string): Promise<RoomParticipant | null> {
    const membership = await this.prisma.roomMembership.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
      include: { user: true },
    });
    if (!membership) return null;

    return {
      id: membership.id,
      userId: membership.userId,
      displayName: membership.user.displayName,
      role: membership.role as RoomRole,
      isOnline: membership.isOnline,
      joinedAt: membership.joinedAt.getTime(),
    };
  }

  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    const memberships = await this.prisma.roomMembership.findMany({
      where: { roomId },
      include: { user: true },
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      displayName: m.user.displayName,
      role: m.role as RoomRole,
      isOnline: m.isOnline,
      joinedAt: m.joinedAt.getTime(),
    }));
  }

  async updateParticipantRole(roomId: string, userId: string, role: RoomRole): Promise<void> {
    await this.prisma.roomMembership.update({
      where: { roomId_userId: { roomId, userId } },
      data: { role: role as PrismaRole },
    });
  }

  async updateParticipantStatus(roomId: string, userId: string, isOnline: boolean): Promise<void> {
    await this.prisma.roomMembership.updateMany({
      where: { roomId, userId },
      data: { isOnline },
    });
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    await this.prisma.roomMembership.deleteMany({
      where: { roomId, userId },
    });
  }

  async getPlaybackState(roomId: string): Promise<PlaybackState | null> {
    const state = await this.prisma.playbackState.findUnique({
      where: { roomId },
    });
    if (!state) return null;

    return {
      videoId: state.videoId,
      videoTitle: state.videoTitle || undefined,
      status: state.status as PlaybackState['status'],
      position: state.position,
      timestamp: Number(state.serverTimestamp),
      version: state.version,
      updatedBy: state.updatedBy,
    };
  }

  async updatePlaybackState(roomId: string, playback: PlaybackState): Promise<void> {
    await this.prisma.playbackState.update({
      where: { roomId },
      data: {
        videoId: playback.videoId,
        videoTitle: playback.videoTitle,
        status: playback.status as PrismaStatus,
        position: playback.position,
        serverTimestamp: BigInt(playback.timestamp),
        version: playback.version,
        updatedBy: playback.updatedBy,
      },
    });
  }

  async createRequest(request: ActionRequest): Promise<ActionRequest> {
    const record = await this.prisma.actionRequest.create({
      data: {
        id: request.id,
        roomId: request.roomId,
        userId: request.userId,
        userName: request.userName,
        action: request.action as PrismaAction,
        payload: request.payload as any,
        status: request.status as PrismaReqStatus,
        createdAt: new Date(request.createdAt),
        expiresAt: new Date(request.expiresAt),
      },
    });

    return {
      ...request,
      id: record.id,
    };
  }

  async getRequestById(requestId: string): Promise<ActionRequest | null> {
    const record = await this.prisma.actionRequest.findUnique({
      where: { id: requestId },
    });
    if (!record) return null;

    return {
      id: record.id,
      roomId: record.roomId,
      userId: record.userId,
      userName: record.userName,
      action: record.action as ActionRequest['action'],
      payload: record.payload as any,
      status: record.status as ActionRequest['status'],
      createdAt: record.createdAt.getTime(),
      expiresAt: record.expiresAt.getTime(),
      resolvedAt: record.resolvedAt ? record.resolvedAt.getTime() : undefined,
      resolvedBy: record.resolvedById || undefined,
      resolvedByName: record.resolvedByName || undefined,
    };
  }

  async getRoomRequests(roomId: string): Promise<ActionRequest[]> {
    const records = await this.prisma.actionRequest.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = Date.now();
    return records.map((record) => {
      let status = record.status as ActionRequest['status'];
      if (status === 'PENDING' && record.expiresAt.getTime() < now) {
        status = 'EXPIRED';
      }
      return {
        id: record.id,
        roomId: record.roomId,
        userId: record.userId,
        userName: record.userName,
        action: record.action as ActionRequest['action'],
        payload: record.payload as any,
        status,
        createdAt: record.createdAt.getTime(),
        expiresAt: record.expiresAt.getTime(),
        resolvedAt: record.resolvedAt ? record.resolvedAt.getTime() : undefined,
        resolvedBy: record.resolvedById || undefined,
        resolvedByName: record.resolvedByName || undefined,
      };
    });
  }

  async updateRequestStatus(
    requestId: string, 
    status: ActionRequest['status'], 
    resolvedById?: string, 
    resolvedByName?: string
  ): Promise<ActionRequest | null> {
    const record = await this.prisma.actionRequest.update({
      where: { id: requestId },
      data: {
        status: status as PrismaReqStatus,
        resolvedAt: new Date(),
        resolvedById,
        resolvedByName,
      },
    });

    return {
      id: record.id,
      roomId: record.roomId,
      userId: record.userId,
      userName: record.userName,
      action: record.action as ActionRequest['action'],
      payload: record.payload as any,
      status: record.status as ActionRequest['status'],
      createdAt: record.createdAt.getTime(),
      expiresAt: record.expiresAt.getTime(),
      resolvedAt: record.resolvedAt ? record.resolvedAt.getTime() : undefined,
      resolvedBy: record.resolvedById || undefined,
      resolvedByName: record.resolvedByName || undefined,
    };
  }

  async saveChatMessage(message: ChatMessage): Promise<ChatMessage> {
    const record = await this.prisma.chatMessage.create({
      data: {
        id: message.id,
        roomId: message.roomId,
        userId: message.userId,
        userName: message.userName,
        userRole: message.userRole as PrismaRole,
        content: message.content,
        createdAt: new Date(message.timestamp),
      },
    });

    return {
      id: record.id,
      roomId: record.roomId,
      userId: record.userId,
      userName: record.userName,
      userRole: record.userRole as RoomRole,
      content: record.content,
      timestamp: record.createdAt.getTime(),
    };
  }

  async getRecentChatMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const records = await this.prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return records.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      userId: r.userId,
      userName: r.userName,
      userRole: r.userRole as RoomRole,
      content: r.content,
      timestamp: r.createdAt.getTime(),
    }));
  }
}
