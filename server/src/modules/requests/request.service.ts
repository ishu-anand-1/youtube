import crypto from 'crypto';
import { 
  ActionRequest, 
  ActionType, 
  PlaybackState, 
  RoomRole, 
  UserSession 
} from '@watchtogether/shared';
import { getRepository } from '../../repositories/index.js';
import { permissionService } from '../roles/permission.service.js';
import { playbackService } from '../playback/playback.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export class RequestService {
  async createRequest(params: {
    roomId: string;
    session: UserSession;
    userRole: RoomRole;
    action: ActionType;
    position?: number;
    urlOrId?: string;
    videoTitle?: string;
  }): Promise<ActionRequest> {
    permissionService.assertCanSubmitRequest(params.userRole);

    const repo = await getRepository();
    const existingRequests = await repo.getRoomRequests(params.roomId);

    // Prevent spam: check if user already has more than 3 pending requests
    const userPending = existingRequests.filter(
      (r) => r.userId === params.session.userId && r.status === 'PENDING'
    );
    if (userPending.length >= 3) {
      throw new Error('You already have multiple pending requests. Please wait for them to be reviewed.');
    }

    const now = Date.now();
    const expiresAt = now + env.REQUEST_TTL_SECONDS * 1000;

    const request: ActionRequest = {
      id: crypto.randomUUID(),
      roomId: params.roomId,
      userId: params.session.userId,
      userName: params.session.displayName,
      action: params.action,
      payload: {
        position: params.position,
        videoId: params.urlOrId,
        videoTitle: params.videoTitle,
      },
      status: 'PENDING',
      createdAt: now,
      expiresAt,
    };

    await repo.createRequest(request);
    logger.info({ requestId: request.id, roomId: params.roomId, action: request.action }, 'Action request created');
    return request;
  }

  async getRoomRequests(roomId: string): Promise<ActionRequest[]> {
    const repo = await getRepository();
    return repo.getRoomRequests(roomId);
  }

  async resolveRequest(params: {
    roomId: string;
    requestId: string;
    approver: { userId: string; displayName: string; role: RoomRole };
    decision: 'APPROVE' | 'REJECT';
  }): Promise<{ request: ActionRequest; updatedPlayback?: PlaybackState }> {
    permissionService.assertCanManageRequests(params.approver.role);

    const repo = await getRepository();
    const request = await repo.getRequestById(params.requestId);

    if (!request || request.roomId !== params.roomId) {
      throw new Error('Request not found in this room');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Request has already been resolved as ${request.status}`);
    }

    if (request.expiresAt < Date.now()) {
      await repo.updateRequestStatus(request.id, 'EXPIRED');
      throw new Error('This request has expired and can no longer be processed');
    }

    // Participants cannot self-approve
    if (request.userId === params.approver.userId && params.decision === 'APPROVE') {
      throw new Error('You cannot approve your own request');
    }

    const newStatus = params.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updatedRequest = await repo.updateRequestStatus(
      request.id,
      newStatus,
      params.approver.userId,
      params.approver.displayName
    );

    let updatedPlayback: PlaybackState | undefined;

    // If approved, execute the requested action through the authoritative playback engine
    if (params.decision === 'APPROVE') {
      const actor = {
        userId: params.approver.userId,
        displayName: `${params.approver.displayName} (for ${request.userName})`,
        role: params.approver.role,
      };

      switch (request.action) {
        case 'PLAY':
          updatedPlayback = await playbackService.play(params.roomId, actor, request.payload.position);
          break;
        case 'PAUSE':
          updatedPlayback = await playbackService.pause(params.roomId, actor, request.payload.position);
          break;
        case 'SEEK':
          if (typeof request.payload.position === 'number') {
            updatedPlayback = await playbackService.seek(params.roomId, actor, request.payload.position);
          }
          break;
        case 'CHANGE_VIDEO':
          if (request.payload.videoId) {
            updatedPlayback = await playbackService.changeVideo(
              params.roomId,
              actor,
              request.payload.videoId,
              request.payload.videoTitle
            );
          }
          break;
      }
    }

    logger.info({
      requestId: request.id,
      decision: params.decision,
      resolvedBy: params.approver.displayName,
    }, 'Request resolved');

    return { request: updatedRequest!, updatedPlayback };
  }
}

export const requestService = new RequestService();
