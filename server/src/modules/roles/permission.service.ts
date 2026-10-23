import { 
  RoomRole, 
  canControlPlayback, 
  canAssignRoles, 
  canRemoveParticipants, 
  canManageRequests, 
  canTransferHost, 
  canSubmitRequest,
  canChangeTargetRole 
} from '@watchtogether/shared';

export class PermissionError extends Error {
  code = 'FORBIDDEN';
  status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class PermissionService {
  assertCanControlPlayback(role: RoomRole): void {
    if (!canControlPlayback(role)) {
      throw new PermissionError('Only the Host or a Moderator can control playback directly');
    }
  }

  assertCanAssignRole(actorRole: RoomRole, currentTargetRole: RoomRole, newRole: RoomRole): void {
    if (!canAssignRoles(actorRole)) {
      throw new PermissionError('Only the Host can assign or change roles');
    }
    if (!canChangeTargetRole(actorRole, currentTargetRole, newRole)) {
      throw new PermissionError(`Cannot change role from ${currentTargetRole} to ${newRole}`);
    }
  }

  assertCanRemoveParticipant(actorRole: RoomRole, targetRole: RoomRole): void {
    if (!canRemoveParticipants(actorRole)) {
      throw new PermissionError('Only the Host can remove participants from the room');
    }
    if (targetRole === 'HOST') {
      throw new PermissionError('The Host cannot remove themselves from the room');
    }
  }

  assertCanManageRequests(role: RoomRole): void {
    if (!canManageRequests(role)) {
      throw new PermissionError('Only the Host or a Moderator can approve or reject requests');
    }
  }

  assertCanSubmitRequest(role: RoomRole): void {
    if (!canSubmitRequest(role)) {
      throw new PermissionError('Only participants submit action requests (Hosts and Moderators have direct control)');
    }
  }
}

export const permissionService = new PermissionService();
