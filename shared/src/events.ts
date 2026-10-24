import { 
  ActionType, 
  PlaybackState, 
  RoomDetails, 
  RoomParticipant, 
  RoomRole, 
  ActionRequest, 
  ChatMessage 
} from './types.js';

export const CLIENT_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_VIDEO: 'change_video',
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  REQUEST_ACTION: 'request_action',
  APPROVE_REQUEST: 'approve_request',
  REJECT_REQUEST: 'reject_request',
  CHAT_MESSAGE: 'chat_message',
  GET_SYNC_STATE: 'get_sync_state',
  SEND_REACTION: 'send_reaction',
  QUEUE_ADD: 'queue_add',
  QUEUE_REMOVE: 'queue_remove',
  QUEUE_PLAY_NEXT: 'queue_play_next',
  UPDATE_SETTINGS: 'update_settings',
  PING: 'ping_check',
} as const;

export const SERVER_EVENTS = {
  ROOM_JOINED: 'room_joined',
  ROOM_STATE: 'room_state',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  PLAYBACK_UPDATED: 'playback_updated',
  VIDEO_CHANGED: 'video_changed',
  ROLE_ASSIGNED: 'role_assigned',
  PARTICIPANT_REMOVED: 'participant_removed',
  REQUEST_CREATED: 'request_created',
  REQUEST_UPDATED: 'request_updated',
  CHAT_MESSAGE: 'chat_message',
  SYNC_STATE: 'sync_state',
  REACTION_BROADCAST: 'reaction_broadcast',
  QUEUE_UPDATED: 'queue_updated',
  SETTINGS_UPDATED: 'settings_updated',
  PONG: 'pong_check',
  ERROR: 'error',
  NOTIFICATION: 'notification',
} as const;

// Typed payloads for client emits
export interface JoinRoomPayload {
  roomId: string;
}

export interface PlayPayload {
  roomId: string;
  position?: number;
}

export interface PausePayload {
  roomId: string;
  position: number;
}

export interface SeekPayload {
  roomId: string;
  position: number;
}

export interface ChangeVideoPayload {
  roomId: string;
  urlOrId: string;
  videoTitle?: string;
}

export interface AssignRolePayload {
  roomId: string;
  targetUserId: string;
  role: RoomRole;
}

export interface RemoveParticipantPayload {
  roomId: string;
  targetUserId: string;
  reason?: string;
}

export interface RequestActionPayload {
  roomId: string;
  action: ActionType;
  position?: number;
  urlOrId?: string;
  videoTitle?: string;
}

export interface ResolveRequestPayload {
  roomId: string;
  requestId: string;
}

export interface SendChatMessagePayload {
  roomId: string;
  content: string;
}

// Typed payloads for server broadcasts
export interface RoomJoinedData {
  room: RoomDetails;
  currentRole: RoomRole;
}

export interface PlaybackUpdatedData {
  playback: PlaybackState;
  actor: {
    userId: string;
    displayName: string;
    role: RoomRole;
  };
}

export interface RoleAssignedData {
  targetUserId: string;
  targetDisplayName: string;
  newRole: RoomRole;
  assignedBy: string;
}

export interface ParticipantRemovedData {
  targetUserId: string;
  targetDisplayName: string;
  reason?: string;
}

export interface SocketAckResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
