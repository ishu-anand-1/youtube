import { describe, it, expect } from 'vitest';
import { 
  extractYouTubeVideoId, 
  isValidYouTubeUrl, 
  CreateRoomSchema, 
  JoinRoomSchema, 
  canControlPlayback, 
  canAssignRoles, 
  canRemoveParticipants, 
  canChangeTargetRole 
} from '../index.js';

describe('YouTube URL parser', () => {
  it('parses standard watch URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
  });

  it('parses short share URL (youtu.be)', () => {
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('parses embed URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('accepts bare 11-char ID', () => {
    expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects invalid or malicious inputs', () => {
    expect(extractYouTubeVideoId('javascript:alert(1)')).toBeNull();
    expect(extractYouTubeVideoId('https://attacker.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(extractYouTubeVideoId('not-a-valid-id')).toBeNull();
    expect(isValidYouTubeUrl('https://example.com')).toBe(false);
  });
});

describe('Role permissions', () => {
  it('allows Host and Moderator to control playback, but not Participant', () => {
    expect(canControlPlayback('HOST')).toBe(true);
    expect(canControlPlayback('MODERATOR')).toBe(true);
    expect(canControlPlayback('PARTICIPANT')).toBe(false);
  });

  it('only allows Host to assign roles and remove participants', () => {
    expect(canAssignRoles('HOST')).toBe(true);
    expect(canAssignRoles('MODERATOR')).toBe(false);
    expect(canAssignRoles('PARTICIPANT')).toBe(false);

    expect(canRemoveParticipants('HOST')).toBe(true);
    expect(canRemoveParticipants('MODERATOR')).toBe(false);
    expect(canRemoveParticipants('PARTICIPANT')).toBe(false);
  });

  it('validates target role transitions', () => {
    expect(canChangeTargetRole('HOST', 'PARTICIPANT', 'MODERATOR')).toBe(true);
    expect(canChangeTargetRole('HOST', 'MODERATOR', 'PARTICIPANT')).toBe(true);
    // Participant cannot promote themselves or others
    expect(canChangeTargetRole('PARTICIPANT', 'PARTICIPANT', 'MODERATOR')).toBe(false);
    // Host cannot assign HOST role through simple role change
    expect(canChangeTargetRole('HOST', 'PARTICIPANT', 'HOST')).toBe(false);
  });
});

describe('Zod Schemas', () => {
  it('validates CreateRoomSchema', () => {
    const valid = CreateRoomSchema.safeParse({
      name: 'Movie Night',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      displayName: 'Alice',
    });
    expect(valid.success).toBe(true);

    const invalidName = CreateRoomSchema.safeParse({
      displayName: 'A', // too short
    });
    expect(invalidName.success).toBe(false);
  });

  it('validates JoinRoomSchema with 6-char room code', () => {
    const valid = JoinRoomSchema.safeParse({
      roomCode: 'AB12CD',
      displayName: 'Bob',
    });
    expect(valid.success).toBe(true);

    const invalidCode = JoinRoomSchema.safeParse({
      roomCode: 'abc', // too short
      displayName: 'Bob',
    });
    expect(invalidCode.success).toBe(false);
  });
});
