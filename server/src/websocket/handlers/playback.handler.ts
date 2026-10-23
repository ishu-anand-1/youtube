import { Server, Socket } from 'socket.io';
import { 
  CLIENT_EVENTS, 
  SERVER_EVENTS, 
  PlaybackCommandSchema, 
  ChangeVideoSchema, 
  SocketAckResponse,
  extractYouTubeVideoId 
} from '@watchtogether/shared';
import { playbackService } from '../../modules/playback/playback.service.js';
import { getRepository } from '../../repositories/index.js';
import { logger } from '../../config/logger.js';

export function registerPlaybackHandlers(io: Server, socket: Socket) {
  // Play
  socket.on(CLIENT_EVENTS.PLAY, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = PlaybackCommandSchema.parse(data);
      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);

      if (!participant) {
        throw new Error('You are not a registered participant in this room');
      }

      const updated = await playbackService.play(
        parsed.roomId,
        { userId: session.userId, displayName: session.displayName, role: participant.role },
        parsed.position
      );

      // Broadcast to room members
      io.to(parsed.roomId).emit(SERVER_EVENTS.PLAYBACK_UPDATED, {
        playback: updated,
        actor: {
          userId: session.userId,
          displayName: session.displayName,
          role: participant.role,
        },
      });

      ack?.({ success: true, data: updated });
    } catch (err: any) {
      logger.warn({ err: err.message, socketId: socket.id }, 'Playback PLAY error');
      ack?.({ success: false, error: { code: err.code || 'PLAYBACK_ERROR', message: err.message } });
    }
  });

  // Pause
  socket.on(CLIENT_EVENTS.PAUSE, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = PlaybackCommandSchema.parse(data);
      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);

      if (!participant) {
        throw new Error('You are not a registered participant in this room');
      }

      const updated = await playbackService.pause(
        parsed.roomId,
        { userId: session.userId, displayName: session.displayName, role: participant.role },
        parsed.position
      );

      io.to(parsed.roomId).emit(SERVER_EVENTS.PLAYBACK_UPDATED, {
        playback: updated,
        actor: {
          userId: session.userId,
          displayName: session.displayName,
          role: participant.role,
        },
      });

      ack?.({ success: true, data: updated });
    } catch (err: any) {
      logger.warn({ err: err.message, socketId: socket.id }, 'Playback PAUSE error');
      ack?.({ success: false, error: { code: err.code || 'PLAYBACK_ERROR', message: err.message } });
    }
  });

  // Seek
  socket.on(CLIENT_EVENTS.SEEK, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = PlaybackCommandSchema.parse(data);
      if (typeof parsed.position !== 'number') {
        throw new Error('Seek position is required');
      }

      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);

      if (!participant) {
        throw new Error('You are not a registered participant in this room');
      }

      const updated = await playbackService.seek(
        parsed.roomId,
        { userId: session.userId, displayName: session.displayName, role: participant.role },
        parsed.position
      );

      io.to(parsed.roomId).emit(SERVER_EVENTS.PLAYBACK_UPDATED, {
        playback: updated,
        actor: {
          userId: session.userId,
          displayName: session.displayName,
          role: participant.role,
        },
      });

      ack?.({ success: true, data: updated });
    } catch (err: any) {
      logger.warn({ err: err.message, socketId: socket.id }, 'Playback SEEK error');
      ack?.({ success: false, error: { code: err.code || 'PLAYBACK_ERROR', message: err.message } });
    }
  });

  // Change Video
  socket.on(CLIENT_EVENTS.CHANGE_VIDEO, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = ChangeVideoSchema.parse(data);
      const videoId = extractYouTubeVideoId(parsed.urlOrId);
      if (!videoId) {
        throw new Error('Invalid YouTube URL or ID');
      }

      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);

      if (!participant) {
        throw new Error('You are not a registered participant in this room');
      }

      const updated = await playbackService.changeVideo(
        parsed.roomId,
        { userId: session.userId, displayName: session.displayName, role: participant.role },
        videoId,
        parsed.videoTitle
      );

      io.to(parsed.roomId).emit(SERVER_EVENTS.VIDEO_CHANGED, {
        playback: updated,
        actor: {
          userId: session.userId,
          displayName: session.displayName,
          role: participant.role,
        },
      });

      ack?.({ success: true, data: updated });
    } catch (err: any) {
      logger.warn({ err: err.message, socketId: socket.id }, 'Playback CHANGE_VIDEO error');
      ack?.({ success: false, error: { code: err.code || 'PLAYBACK_ERROR', message: err.message } });
    }
  });

  // Get Sync State
  socket.on(CLIENT_EVENTS.GET_SYNC_STATE, async (data: { roomId: string }, ack?: (res: SocketAckResponse) => void) => {
    try {
      if (!data?.roomId) throw new Error('Room ID required');
      const authoritative = await playbackService.getAuthoritativeState(data.roomId);
      ack?.({ success: true, data: authoritative });
    } catch (err: any) {
      ack?.({ success: false, error: { code: 'SYNC_ERROR', message: err.message } });
    }
  });
}
