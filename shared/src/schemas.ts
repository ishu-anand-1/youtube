import { z } from 'zod';

/**
 * YouTube URL / Video ID parser and validator.
 * Accepts standard watch URLs, share links (youtu.be), embed URLs, and bare 11-char IDs.
 */
const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;
const BARE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  
  if (BARE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }
  
  const match = trimmed.match(YOUTUBE_REGEX);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeVideoId(input) !== null;
}

// Zod Schemas

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(2, 'Display name must be at least 2 characters')
  .max(30, 'Display name cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_ -]+$/, 'Display name can only contain letters, numbers, spaces, underscores, and hyphens');

export const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(6, 'Room code must be exactly 6 characters')
  .regex(/^[A-Z0-9]{6}$/, 'Room code must be alphanumeric');

export const AvatarColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();

export const CreateRoomSchema = z.object({
  name: z.string().trim().min(2, 'Room name must be at least 2 characters').max(50, 'Room name cannot exceed 50 characters').optional(),
  videoUrl: z
    .string()
    .trim()
    .refine((val) => !val || isValidYouTubeUrl(val), {
      message: 'Invalid YouTube URL or Video ID',
    })
    .optional(),
  displayName: DisplayNameSchema,
  avatarColor: AvatarColorSchema,
  isPrivate: z.boolean().optional(),
});

export const JoinRoomSchema = z.object({
  roomCode: RoomCodeSchema,
  displayName: DisplayNameSchema,
  avatarColor: AvatarColorSchema,
});

export const PlaybackCommandSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  position: z.number().min(0, 'Position must be non-negative').max(86400, 'Position exceeds max 24 hours').optional(),
});

export const ChangeVideoSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  urlOrId: z.string().trim().refine(isValidYouTubeUrl, {
    message: 'Must be a valid YouTube URL or 11-character video ID',
  }),
  videoTitle: z.string().max(150).optional(),
});

export const RoleAssignmentSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  targetUserId: z.string().uuid('Invalid target user ID'),
  role: z.enum(['MODERATOR', 'PARTICIPANT']),
});

export const RemoveParticipantSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  targetUserId: z.string().uuid('Invalid target user ID'),
  reason: z.string().max(100).optional(),
});

export const CreateRequestSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  action: z.enum(['PLAY', 'PAUSE', 'SEEK', 'CHANGE_VIDEO']),
  position: z.number().min(0).max(86400).optional(),
  urlOrId: z.string().optional(),
  videoTitle: z.string().max(150).optional(),
}).refine((data) => {
  if (data.action === 'SEEK' && typeof data.position !== 'number') return false;
  if (data.action === 'CHANGE_VIDEO' && (!data.urlOrId || !isValidYouTubeUrl(data.urlOrId))) return false;
  return true;
}, {
  message: 'Invalid payload for the requested action',
});

export const ResolveRequestSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  requestId: z.string().uuid('Invalid request ID'),
});

export const ChatMessageSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message cannot exceed 500 characters'),
  replyToId: z.string().uuid().optional(),
  replyToContent: z.string().max(150).optional(),
  replyToUserName: z.string().max(50).optional(),
});

export const QueueAddSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  urlOrId: z.string().trim().refine(isValidYouTubeUrl, {
    message: 'Must be a valid YouTube URL or 11-character video ID',
  }),
  videoTitle: z.string().max(150).optional(),
});

export const QueueRemoveSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  queueItemId: z.string().uuid('Invalid queue item ID'),
});

export const QueuePlayNextSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});

export const SendReactionSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  emoji: z.string().min(1).max(8),
});

export const UpdateSettingsSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  name: z.string().trim().min(2, 'Room name must be at least 2 characters').max(50).optional(),
  controlMode: z.enum(['HOST_ONLY', 'ALL']).optional(),
  chatEnabled: z.boolean().optional(),
  participantLimit: z.number().int().min(2).max(100).optional(),
  isPrivate: z.boolean().optional(),
});
