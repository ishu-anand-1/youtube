import { PlaybackState, RoomRole } from '@watchtogether/shared';
import { getRepository } from '../../repositories/index.js';
import { permissionService } from '../roles/permission.service.js';
import { logger } from '../../config/logger.js';

export class PlaybackService {
  // Per-room execution mutex to serialize concurrent state changes
  private roomLocks = new Map<string, Promise<void>>();

  private async acquireLock<T>(roomId: string, action: () => Promise<T>): Promise<T> {
    const prevLock = this.roomLocks.get(roomId) || Promise.resolve();
    let release: () => void;
    const currentLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.roomLocks.set(roomId, prevLock.then(() => currentLock));

    try {
      await prevLock;
      return await action();
    } finally {
      release!();
      if (this.roomLocks.get(roomId) === currentLock) {
        this.roomLocks.delete(roomId);
      }
    }
  }

  /**
   * Calculates the exact authoritative current position based on server elapsed time.
   */
  calculateCurrentPosition(playback: PlaybackState, now: number = Date.now()): number {
    if (playback.status === 'PLAYING') {
      const elapsedSeconds = Math.max(0, (now - playback.timestamp) / 1000);
      return Number((playback.position + elapsedSeconds).toFixed(2));
    }
    return Number(playback.position.toFixed(2));
  }

  async getAuthoritativeState(roomId: string): Promise<PlaybackState> {
    const repo = await getRepository();
    const playback = await repo.getPlaybackState(roomId);
    if (!playback) {
      throw new Error(`Room playback state not found for room ${roomId}`);
    }

    const now = Date.now();
    const currentPosition = this.calculateCurrentPosition(playback, now);

    return {
      ...playback,
      position: currentPosition,
    };
  }

  async play(
    roomId: string,
    actor: { userId: string; displayName: string; role: RoomRole },
    clientPosition?: number
  ): Promise<PlaybackState> {
    permissionService.assertCanControlPlayback(actor.role);

    return this.acquireLock(roomId, async () => {
      const repo = await getRepository();
      const current = await repo.getPlaybackState(roomId);
      if (!current) throw new Error('Playback state not found');

      const now = Date.now();
      let newPosition: number;

      if (typeof clientPosition === 'number' && clientPosition >= 0) {
        newPosition = clientPosition;
      } else {
        newPosition = this.calculateCurrentPosition(current, now);
      }

      const updated: PlaybackState = {
        ...current,
        status: 'PLAYING',
        position: newPosition,
        timestamp: now,
        version: current.version + 1,
        updatedBy: actor.displayName,
      };

      await repo.updatePlaybackState(roomId, updated);
      logger.info({ roomId, version: updated.version, actor: actor.displayName }, 'Playback transitioned to PLAYING');
      return updated;
    });
  }

  async pause(
    roomId: string,
    actor: { userId: string; displayName: string; role: RoomRole },
    clientPosition?: number
  ): Promise<PlaybackState> {
    permissionService.assertCanControlPlayback(actor.role);

    return this.acquireLock(roomId, async () => {
      const repo = await getRepository();
      const current = await repo.getPlaybackState(roomId);
      if (!current) throw new Error('Playback state not found');

      const now = Date.now();
      let newPosition: number;

      if (typeof clientPosition === 'number' && clientPosition >= 0) {
        newPosition = clientPosition;
      } else {
        newPosition = this.calculateCurrentPosition(current, now);
      }

      const updated: PlaybackState = {
        ...current,
        status: 'PAUSED',
        position: newPosition,
        timestamp: now,
        version: current.version + 1,
        updatedBy: actor.displayName,
      };

      await repo.updatePlaybackState(roomId, updated);
      logger.info({ roomId, version: updated.version, actor: actor.displayName }, 'Playback transitioned to PAUSED');
      return updated;
    });
  }

  async seek(
    roomId: string,
    actor: { userId: string; displayName: string; role: RoomRole },
    targetPosition: number
  ): Promise<PlaybackState> {
    permissionService.assertCanControlPlayback(actor.role);

    return this.acquireLock(roomId, async () => {
      const repo = await getRepository();
      const current = await repo.getPlaybackState(roomId);
      if (!current) throw new Error('Playback state not found');

      const now = Date.now();
      const updated: PlaybackState = {
        ...current,
        position: Math.max(0, targetPosition),
        timestamp: now,
        version: current.version + 1,
        updatedBy: actor.displayName,
      };

      await repo.updatePlaybackState(roomId, updated);
      logger.info({ roomId, version: updated.version, targetPosition }, 'Playback seek applied');
      return updated;
    });
  }

  async changeVideo(
    roomId: string,
    actor: { userId: string; displayName: string; role: RoomRole },
    videoId: string,
    videoTitle?: string
  ): Promise<PlaybackState> {
    permissionService.assertCanControlPlayback(actor.role);

    return this.acquireLock(roomId, async () => {
      const repo = await getRepository();
      const current = await repo.getPlaybackState(roomId);
      if (!current) throw new Error('Playback state not found');

      const now = Date.now();
      const updated: PlaybackState = {
        videoId,
        videoTitle: videoTitle || 'YouTube Video',
        status: 'PAUSED',
        position: 0,
        timestamp: now,
        version: current.version + 1,
        updatedBy: actor.displayName,
      };

      await repo.updatePlaybackState(roomId, updated);
      logger.info({ roomId, videoId, version: updated.version }, 'Video changed');
      return updated;
    });
  }
}

export const playbackService = new PlaybackService();
