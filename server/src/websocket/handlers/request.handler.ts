import { Server, Socket } from 'socket.io';
import { 
  CLIENT_EVENTS, 
  SERVER_EVENTS, 
  CreateRequestSchema, 
  ResolveRequestSchema, 
  SocketAckResponse 
} from '@watchtogether/shared';
import { requestService } from '../../modules/requests/request.service.js';
import { getRepository } from '../../repositories/index.js';
import { logger } from '../../config/logger.js';

export function registerRequestHandlers(io: Server, socket: Socket) {
  // Request Action (by participant)
  socket.on(CLIENT_EVENTS.REQUEST_ACTION, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = CreateRequestSchema.parse(data);

      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);
      if (!participant) {
        throw new Error('You are not a member of this room');
      }

      const request = await requestService.createRequest({
        roomId: parsed.roomId,
        session,
        userRole: participant.role,
        action: parsed.action,
        position: parsed.position,
        urlOrId: parsed.urlOrId,
        videoTitle: parsed.videoTitle,
      });

      // Broadcast new request to room
      io.to(parsed.roomId).emit(SERVER_EVENTS.REQUEST_CREATED, { request });

      ack?.({ success: true, data: request });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Request action error');
      ack?.({ success: false, error: { code: err.code || 'REQUEST_ERROR', message: err.message } });
    }
  });

  // Approve Request (by host or moderator)
  socket.on(CLIENT_EVENTS.APPROVE_REQUEST, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = ResolveRequestSchema.parse(data);

      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);
      if (!participant) {
        throw new Error('You are not a member of this room');
      }

      const { request, updatedPlayback } = await requestService.resolveRequest({
        roomId: parsed.roomId,
        requestId: parsed.requestId,
        approver: {
          userId: session.userId,
          displayName: session.displayName,
          role: participant.role,
        },
        decision: 'APPROVE',
      });

      // Broadcast request resolution
      io.to(parsed.roomId).emit(SERVER_EVENTS.REQUEST_UPDATED, { request });

      // If playback updated as result of approval, broadcast playback update
      if (updatedPlayback) {
        if (request.action === 'CHANGE_VIDEO') {
          io.to(parsed.roomId).emit(SERVER_EVENTS.VIDEO_CHANGED, {
            playback: updatedPlayback,
            actor: {
              userId: session.userId,
              displayName: `${session.displayName} (for ${request.userName})`,
              role: participant.role,
            },
          });
        } else {
          io.to(parsed.roomId).emit(SERVER_EVENTS.PLAYBACK_UPDATED, {
            playback: updatedPlayback,
            actor: {
              userId: session.userId,
              displayName: `${session.displayName} (for ${request.userName})`,
              role: participant.role,
            },
          });
        }
      }

      ack?.({ success: true, data: { request, updatedPlayback } });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Approve request error');
      ack?.({ success: false, error: { code: err.code || 'APPROVE_ERROR', message: err.message } });
    }
  });

  // Reject Request
  socket.on(CLIENT_EVENTS.REJECT_REQUEST, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = ResolveRequestSchema.parse(data);

      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);
      if (!participant) {
        throw new Error('You are not a member of this room');
      }

      const { request } = await requestService.resolveRequest({
        roomId: parsed.roomId,
        requestId: parsed.requestId,
        approver: {
          userId: session.userId,
          displayName: session.displayName,
          role: participant.role,
        },
        decision: 'REJECT',
      });

      io.to(parsed.roomId).emit(SERVER_EVENTS.REQUEST_UPDATED, { request });
      ack?.({ success: true, data: { request } });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Reject request error');
      ack?.({ success: false, error: { code: err.code || 'REJECT_ERROR', message: err.message } });
    }
  });
}
