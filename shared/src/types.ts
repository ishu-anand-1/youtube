export type RoomRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

export type PlaybackStatus = 'PLAYING' | 'PAUSED' | 'BUFFERING';

export interface PlaybackState {
  videoId: string;
  videoTitle?: string;
  status: PlaybackStatus;
  position: number; // in seconds
  timestamp: number; // unix milliseconds of server state change
  version: number; // monotonic sequence for concurrency control
  updatedBy: string; // user id or display name of the actor
}

export interface RoomParticipant {
  id: string; // membership id
  userId: string;
  displayName: string;
  avatarColor?: string;
  role: RoomRole;
  isOnline: boolean;
  joinedAt: number;
  pingMs?: number;
}

export interface QueueItem {
  id: string;
  roomId: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  addedById: string;
  addedByName: string;
  order: number;
  createdAt: number;
}

export interface RoomSettings {
  controlMode: 'HOST_ONLY' | 'ALL';
  chatEnabled: boolean;
  participantLimit?: number;
  isPrivate?: boolean;
}

export interface ReactionEvent {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  emoji: string;
  timestamp: number;
}

export interface RoomDetails {
  id: string;
  code: string;
  name: string;
  hostId: string;
  createdAt: number;
  playback: PlaybackState;
  participants: RoomParticipant[];
  queue?: QueueItem[];
  settings?: RoomSettings;
}

export type ActionType = 'PLAY' | 'PAUSE' | 'SEEK' | 'CHANGE_VIDEO';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface ActionPayload {
  position?: number;
  videoId?: string;
  videoTitle?: string;
  videoUrl?: string;
}

export interface ActionRequest {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  action: ActionType;
  payload: ActionPayload;
  status: RequestStatus;
  createdAt: number;
  expiresAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolvedByName?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userRole: RoomRole;
  avatarColor?: string;
  content: string;
  timestamp: number;
  replyToId?: string;
  replyToContent?: string;
  replyToUserName?: string;
}

export interface UserSession {
  userId: string;
  displayName: string;
  avatarColor?: string;
  token: string;
  createdAt: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
