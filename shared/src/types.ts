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
  role: RoomRole;
  isOnline: boolean;
  joinedAt: number;
}

export interface RoomDetails {
  id: string;
  code: string;
  name: string;
  hostId: string;
  createdAt: number;
  playback: PlaybackState;
  participants: RoomParticipant[];
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
  content: string;
  timestamp: number;
}

export interface UserSession {
  userId: string;
  displayName: string;
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
