import { 
  ActionRequest, 
  ChatMessage, 
  PlaybackState, 
  RoomDetails, 
  RoomParticipant, 
  RoomRole, 
  UserSession 
} from '@watchtogether/shared';

export interface IRepository {
  // Session
  createSession(displayName: string, token: string, tokenHash: string): Promise<UserSession>;
  findSessionByTokenHash(tokenHash: string): Promise<UserSession | null>;
  updateSessionActivity(userId: string): Promise<void>;

  // Room
  createRoom(params: {
    code: string;
    name: string;
    hostId: string;
    hostDisplayName: string;
    videoId: string;
    videoTitle?: string;
  }): Promise<RoomDetails>;
  getRoomById(id: string): Promise<RoomDetails | null>;
  getRoomByCode(code: string): Promise<RoomDetails | null>;
  deleteRoom(id: string): Promise<void>;

  // Memberships
  addOrUpdateParticipant(
    roomId: string, 
    userId: string, 
    displayName: string, 
    role: RoomRole, 
    isOnline: boolean
  ): Promise<RoomParticipant>;
  getParticipant(roomId: string, userId: string): Promise<RoomParticipant | null>;
  getRoomParticipants(roomId: string): Promise<RoomParticipant[]>;
  updateParticipantRole(roomId: string, userId: string, role: RoomRole): Promise<void>;
  updateParticipantStatus(roomId: string, userId: string, isOnline: boolean): Promise<void>;
  removeParticipant(roomId: string, userId: string): Promise<void>;

  // Playback
  getPlaybackState(roomId: string): Promise<PlaybackState | null>;
  updatePlaybackState(roomId: string, playback: PlaybackState): Promise<void>;

  // Requests
  createRequest(request: ActionRequest): Promise<ActionRequest>;
  getRequestById(requestId: string): Promise<ActionRequest | null>;
  getRoomRequests(roomId: string): Promise<ActionRequest[]>;
  updateRequestStatus(
    requestId: string, 
    status: ActionRequest['status'], 
    resolvedById?: string, 
    resolvedByName?: string
  ): Promise<ActionRequest | null>;

  // Chat
  saveChatMessage(message: ChatMessage): Promise<ChatMessage>;
  getRecentChatMessages(roomId: string, limit?: number): Promise<ChatMessage[]>;
}
