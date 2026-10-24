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
import crypto from 'crypto';

export class MemoryRepository implements IRepository {
  private sessions = new Map<string, UserSession & { tokenHash: string }>();
  private rooms = new Map<string, RoomDetails>();
  private memberships = new Map<string, Map<string, RoomParticipant>>(); // roomId -> (userId -> participant)
  private playbacks = new Map<string, PlaybackState>();
  private requests = new Map<string, ActionRequest>();
  private messages = new Map<string, ChatMessage[]>(); // roomId -> messages
  private queues = new Map<string, QueueItem[]>(); // roomId -> queue
  private settings = new Map<string, RoomSettings>(); // roomId -> settings

  async createSession(displayName: string, token: string, tokenHash: string, avatarColor?: string): Promise<UserSession> {
    const userId = crypto.randomUUID();
    const session: UserSession & { tokenHash: string } = {
      userId,
      displayName,
      avatarColor: avatarColor || '#6366F1',
      token,
      tokenHash,
      createdAt: Date.now(),
    };
    this.sessions.set(tokenHash, session);
    return {
      userId: session.userId,
      displayName: session.displayName,
      avatarColor: session.avatarColor,
      token: session.token,
      createdAt: session.createdAt,
    };
  }

  async findSessionByTokenHash(tokenHash: string): Promise<UserSession | null> {
    const session = this.sessions.get(tokenHash);
    if (!session) return null;
    return {
      userId: session.userId,
      displayName: session.displayName,
      avatarColor: session.avatarColor,
      token: session.token,
      createdAt: session.createdAt,
    };
  }

  async updateSessionActivity(_userId: string): Promise<void> {
    // In-memory noop
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
    const roomId = crypto.randomUUID();
    const now = Date.now();

    const playback: PlaybackState = {
      videoId: params.videoId,
      videoTitle: params.videoTitle || 'YouTube Video',
      status: 'PAUSED',
      position: 0,
      timestamp: now,
      version: 1,
      updatedBy: params.hostDisplayName,
    };

    const hostParticipant: RoomParticipant = {
      id: crypto.randomUUID(),
      userId: params.hostId,
      displayName: params.hostDisplayName,
      avatarColor: params.hostAvatarColor || '#6366F1',
      role: 'HOST',
      isOnline: true,
      joinedAt: now,
    };

    const roomSettings: RoomSettings = params.settings || {
      controlMode: 'HOST_ONLY',
      chatEnabled: true,
      participantLimit: 50,
      isPrivate: false,
    };

    const roomDetails: RoomDetails = {
      id: roomId,
      code: params.code,
      name: params.name,
      hostId: params.hostId,
      createdAt: now,
      playback,
      participants: [hostParticipant],
      queue: [],
      settings: roomSettings,
    };

    this.rooms.set(roomId, roomDetails);
    this.playbacks.set(roomId, playback);
    this.settings.set(roomId, roomSettings);
    this.queues.set(roomId, []);

    const roomMembers = new Map<string, RoomParticipant>();
    roomMembers.set(params.hostId, hostParticipant);
    this.memberships.set(roomId, roomMembers);

    return roomDetails;
  }

  async getRoomById(id: string): Promise<RoomDetails | null> {
    const room = this.rooms.get(id);
    if (!room) return null;
    const playback = this.playbacks.get(id) || room.playback;
    const participants = await this.getRoomParticipants(id);
    const queue = this.queues.get(id) || [];
    const settings = this.settings.get(id) || {
      controlMode: 'HOST_ONLY',
      chatEnabled: true,
      participantLimit: 50,
      isPrivate: false,
    };
    return { ...room, playback, participants, queue, settings };
  }

  async getRoomByCode(code: string): Promise<RoomDetails | null> {
    for (const room of this.rooms.values()) {
      if (room.code.toUpperCase() === code.toUpperCase()) {
        return this.getRoomById(room.id);
      }
    }
    return null;
  }

  async updateRoomSettings(roomId: string, newSettings: Partial<RoomSettings>, name?: string): Promise<RoomDetails> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    const existing = this.settings.get(roomId) || {
      controlMode: 'HOST_ONLY',
      chatEnabled: true,
      participantLimit: 50,
      isPrivate: false,
    };
    const updated = { ...existing, ...newSettings };
    this.settings.set(roomId, updated);
    if (name) {
      room.name = name;
    }
    room.settings = updated;
    return (await this.getRoomById(roomId))!;
  }

  async deleteRoom(id: string): Promise<void> {
    this.rooms.delete(id);
    this.playbacks.delete(id);
    this.memberships.delete(id);
    this.messages.delete(id);
    this.queues.delete(id);
    this.settings.delete(id);
    for (const [reqId, req] of this.requests.entries()) {
      if (req.roomId === id) {
        this.requests.delete(reqId);
      }
    }
  }

  async addOrUpdateParticipant(
    roomId: string, 
    userId: string, 
    displayName: string, 
    role: RoomRole, 
    isOnline: boolean,
    avatarColor?: string
  ): Promise<RoomParticipant> {
    let roomMembers = this.memberships.get(roomId);
    if (!roomMembers) {
      roomMembers = new Map();
      this.memberships.set(roomId, roomMembers);
    }

    const existing = roomMembers.get(userId);
    if (existing) {
      existing.isOnline = isOnline;
      existing.displayName = displayName;
      if (avatarColor) existing.avatarColor = avatarColor;
      return existing;
    }

    const participant: RoomParticipant = {
      id: crypto.randomUUID(),
      userId,
      displayName,
      avatarColor: avatarColor || '#6366F1',
      role,
      isOnline,
      joinedAt: Date.now(),
    };
    roomMembers.set(userId, participant);
    return participant;
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
      return { nextItem: null, playback: this.playbacks.get(roomId) || null };
    }
    const nextItem = queue.shift()!;
    this.queues.set(roomId, queue);

    const current = this.playbacks.get(roomId);
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
    const roomMembers = this.memberships.get(roomId);
    if (!roomMembers) return null;
    return roomMembers.get(userId) || null;
  }

  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    const roomMembers = this.memberships.get(roomId);
    if (!roomMembers) return [];
    return Array.from(roomMembers.values());
  }

  async updateParticipantRole(roomId: string, userId: string, role: RoomRole): Promise<void> {
    const roomMembers = this.memberships.get(roomId);
    if (!roomMembers) return;
    const participant = roomMembers.get(userId);
    if (participant) {
      participant.role = role;
    }
  }

  async updateParticipantStatus(roomId: string, userId: string, isOnline: boolean): Promise<void> {
    const roomMembers = this.memberships.get(roomId);
    if (!roomMembers) return;
    const participant = roomMembers.get(userId);
    if (participant) {
      participant.isOnline = isOnline;
    }
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    const roomMembers = this.memberships.get(roomId);
    if (!roomMembers) return;
    roomMembers.delete(userId);
  }

  async getPlaybackState(roomId: string): Promise<PlaybackState | null> {
    return this.playbacks.get(roomId) || null;
  }

  async updatePlaybackState(roomId: string, playback: PlaybackState): Promise<void> {
    this.playbacks.set(roomId, playback);
    const room = this.rooms.get(roomId);
    if (room) {
      room.playback = playback;
    }
  }

  async createRequest(request: ActionRequest): Promise<ActionRequest> {
    this.requests.set(request.id, request);
    return request;
  }

  async getRequestById(requestId: string): Promise<ActionRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async getRoomRequests(roomId: string): Promise<ActionRequest[]> {
    const now = Date.now();
    const result: ActionRequest[] = [];
    for (const req of this.requests.values()) {
      if (req.roomId === roomId) {
        // Automatically mark expired if still pending and past expiration
        if (req.status === 'PENDING' && req.expiresAt < now) {
          req.status = 'EXPIRED';
        }
        result.push(req);
      }
    }
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  async updateRequestStatus(
    requestId: string, 
    status: ActionRequest['status'], 
    resolvedById?: string, 
    resolvedByName?: string
  ): Promise<ActionRequest | null> {
    const req = this.requests.get(requestId);
    if (!req) return null;
    req.status = status;
    req.resolvedAt = Date.now();
    req.resolvedBy = resolvedById;
    req.resolvedByName = resolvedByName;
    return req;
  }

  async saveChatMessage(message: ChatMessage): Promise<ChatMessage> {
    let list = this.messages.get(message.roomId);
    if (!list) {
      list = [];
      this.messages.set(message.roomId, list);
    }
    list.push(message);
    if (list.length > 200) {
      list.shift();
    }
    return message;
  }

  async getRecentChatMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const list = this.messages.get(roomId) || [];
    return list.slice(-limit);
  }
}
