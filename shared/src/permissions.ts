import { RoomRole } from './types.js';

/**
 * Centralized Role-Based Access Control (RBAC) definitions.
 * Used identically across HTTP REST controllers, WebSocket handlers, and UI logic.
 */

export function canControlPlayback(role: RoomRole): boolean {
  return role === 'HOST' || role === 'MODERATOR';
}

export function canAssignRoles(role: RoomRole): boolean {
  return role === 'HOST';
}

export function canRemoveParticipants(role: RoomRole): boolean {
  return role === 'HOST';
}

export function canManageRequests(role: RoomRole): boolean {
  return role === 'HOST' || role === 'MODERATOR';
}

export function canTransferHost(role: RoomRole): boolean {
  return role === 'HOST';
}

export function canSubmitRequest(role: RoomRole): boolean {
  // Participants must request; Hosts and Moderators have direct control
  return role === 'PARTICIPANT';
}

export function canChat(_role: RoomRole): boolean {
  return true;
}

/**
 * Validates whether an actor role can modify the target role.
 * - Only HOST can promote/demote.
 * - HOST cannot demote themselves here.
 * - Targets can only be promoted to MODERATOR or demoted to PARTICIPANT.
 */
export function canChangeTargetRole(actorRole: RoomRole, currentTargetRole: RoomRole, newRole: RoomRole): boolean {
  if (actorRole !== 'HOST') return false;
  if (currentTargetRole === 'HOST') return false;
  if (newRole === 'HOST') return false; // Host transfer is a separate atomic flow
  return newRole === 'MODERATOR' || newRole === 'PARTICIPANT';
}
