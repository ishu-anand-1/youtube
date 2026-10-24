import { RoomRole } from './types.js';

/**
 * Centralized Role-Based Access Control (RBAC) definitions.
 * Used identically across HTTP REST controllers, WebSocket handlers, and UI logic.
 */

export function canControlPlayback(role: RoomRole, controlMode: 'HOST_ONLY' | 'ALL' = 'HOST_ONLY'): boolean {
  if (controlMode === 'ALL') return true;
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

export function canSubmitRequest(role: RoomRole, controlMode: 'HOST_ONLY' | 'ALL' = 'HOST_ONLY'): boolean {
  if (controlMode === 'ALL') return false; // In shared control mode, direct actions are allowed
  return role === 'PARTICIPANT';
}

export function canManageQueue(role: RoomRole): boolean {
  return role === 'HOST' || role === 'MODERATOR';
}

export function canManageSettings(role: RoomRole): boolean {
  return role === 'HOST';
}

export function canCloseRoom(role: RoomRole): boolean {
  return role === 'HOST';
}

export function canChat(_role: RoomRole, chatEnabled: boolean = true): boolean {
  return chatEnabled;
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
