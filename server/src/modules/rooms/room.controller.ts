import { Router, Request, Response, NextFunction } from 'express';
import { 
  CreateRoomSchema, 
  JoinRoomSchema, 
  CreateRequestSchema, 
  ResolveRequestSchema, 
  RoleAssignmentSchema, 
  RemoveParticipantSchema 
} from '@watchtogether/shared';
import { roomService } from './room.service.js';
import { requestService } from '../requests/request.service.js';
import { playbackService } from '../playback/playback.service.js';
import { chatService } from '../chat/chat.service.js';
import { authService } from '../auth/auth.service.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware.js';
import { createRoomLimiter, actionRequestLimiter } from '../../middleware/rate-limit.middleware.js';
import { getRepository } from '../../repositories/index.js';
import { env } from '../../config/env.js';

const router = Router();

// Create room
router.post('/', createRoomLimiter, optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateRoomSchema.parse(req.body);
    let session = req.session;

    // If not authenticated yet, create session on the fly
    if (!session) {
      const created = await authService.createGuestSession(validated.displayName);
      session = created.session;
      res.cookie('wt_session', created.rawToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const room = await roomService.createRoom({
      name: validated.name,
      videoUrl: validated.videoUrl,
      session,
    });

    res.status(201).json({
      success: true,
      data: {
        room,
        session: {
          userId: session.userId,
          displayName: session.displayName,
          token: session.token,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Lookup room by 6-character code
router.get('/code/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await roomService.getRoomByCode(req.params.code);
    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: 'Room not found with this code' },
      });
      return;
    }

    res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
});

// Join room by code
router.post('/join', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = JoinRoomSchema.parse(req.body);
    let session = req.session;

    if (!session) {
      const created = await authService.createGuestSession(validated.displayName);
      session = created.session;
      res.cookie('wt_session', created.rawToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const { room, participant } = await roomService.joinRoom({
      roomCode: validated.roomCode,
      session,
    });

    res.json({
      success: true,
      data: {
        room,
        participant,
        session: {
          userId: session.userId,
          displayName: session.displayName,
          token: session.token,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get room details by ID
router.get('/:roomId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await roomService.getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' },
      });
      return;
    }

    res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
});

// Get authoritative state
router.get('/:roomId/state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playback = await playbackService.getAuthoritativeState(req.params.roomId);
    const repo = await getRepository();
    const participants = await repo.getRoomParticipants(req.params.roomId);

    res.json({
      success: true,
      data: {
        playback,
        participants,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get participants
router.get('/:roomId/participants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = await getRepository();
    const participants = await repo.getRoomParticipants(req.params.roomId);
    res.json({ success: true, data: participants });
  } catch (err) {
    next(err);
  }
});

// Get requests
router.get('/:roomId/requests', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await requestService.getRoomRequests(req.params.roomId);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

// Create request
router.post('/:roomId/requests', requireAuth, actionRequestLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateRequestSchema.parse({
      ...req.body,
      roomId: req.params.roomId,
    });

    const repo = await getRepository();
    const participant = await repo.getParticipant(req.params.roomId, req.session!.userId);
    if (!participant) {
      res.status(403).json({
        success: false,
        error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this room' },
      });
      return;
    }

    const request = await requestService.createRequest({
      roomId: req.params.roomId,
      session: req.session!,
      userRole: participant.role,
      action: validated.action,
      position: validated.position,
      urlOrId: validated.urlOrId,
      videoTitle: validated.videoTitle,
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

// Approve request
router.post('/:roomId/requests/:requestId/approve', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, requestId } = ResolveRequestSchema.parse({
      roomId: req.params.roomId,
      requestId: req.params.requestId,
    });

    const repo = await getRepository();
    const participant = await repo.getParticipant(roomId, req.session!.userId);
    if (!participant) {
      res.status(403).json({
        success: false,
        error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this room' },
      });
      return;
    }

    const result = await requestService.resolveRequest({
      roomId,
      requestId,
      approver: {
        userId: req.session!.userId,
        displayName: req.session!.displayName,
        role: participant.role,
      },
      decision: 'APPROVE',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Reject request
router.post('/:roomId/requests/:requestId/reject', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, requestId } = ResolveRequestSchema.parse({
      roomId: req.params.roomId,
      requestId: req.params.requestId,
    });

    const repo = await getRepository();
    const participant = await repo.getParticipant(roomId, req.session!.userId);
    if (!participant) {
      res.status(403).json({
        success: false,
        error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this room' },
      });
      return;
    }

    const result = await requestService.resolveRequest({
      roomId,
      requestId,
      approver: {
        userId: req.session!.userId,
        displayName: req.session!.displayName,
        role: participant.role,
      },
      decision: 'REJECT',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Assign role
router.patch('/:roomId/participants/:userId/role', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, targetUserId, role } = RoleAssignmentSchema.parse({
      roomId: req.params.roomId,
      targetUserId: req.params.userId,
      role: req.body.role,
    });

    const repo = await getRepository();
    const actor = await repo.getParticipant(roomId, req.session!.userId);
    if (!actor) {
      res.status(403).json({
        success: false,
        error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this room' },
      });
      return;
    }

    const updated = await roomService.assignRole({
      roomId,
      actor: { userId: actor.userId, role: actor.role },
      targetUserId,
      newRole: role,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Remove participant
router.delete('/:roomId/participants/:userId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, targetUserId, reason } = RemoveParticipantSchema.parse({
      roomId: req.params.roomId,
      targetUserId: req.params.userId,
      reason: req.body.reason,
    });

    const repo = await getRepository();
    const actor = await repo.getParticipant(roomId, req.session!.userId);
    if (!actor) {
      res.status(403).json({
        success: false,
        error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this room' },
      });
      return;
    }

    const removed = await roomService.removeParticipant({
      roomId,
      actor: { userId: actor.userId, role: actor.role },
      targetUserId,
      reason,
    });

    res.json({ success: true, data: removed });
  } catch (err) {
    next(err);
  }
});

// Get chat messages
router.get('/:roomId/chat', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const messages = await chatService.getMessages(req.params.roomId, limit);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

export const roomRouter = router;
