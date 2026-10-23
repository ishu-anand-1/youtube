import crypto from 'crypto';
import { UserSession } from '@watchtogether/shared';
import { getRepository } from '../../repositories/index.js';
import { env } from '../../config/env.js';

export class AuthService {
  private hashToken(rawToken: string): string {
    return crypto
      .createHmac('sha256', env.SESSION_SECRET)
      .update(rawToken)
      .digest('hex');
  }

  async createGuestSession(displayName: string): Promise<{ session: UserSession; rawToken: string }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const repo = await getRepository();
    const session = await repo.createSession(displayName, rawToken, tokenHash);

    return { session, rawToken };
  }

  async validateToken(rawToken: string): Promise<UserSession | null> {
    if (!rawToken || typeof rawToken !== 'string') return null;

    const tokenHash = this.hashToken(rawToken);
    const repo = await getRepository();
    const session = await repo.findSessionByTokenHash(tokenHash);

    if (!session) return null;

    // Attach rawToken to the in-memory session object for response headers/cookies
    session.token = rawToken;

    // Async heartbeat for session activity
    void repo.updateSessionActivity(session.userId);

    return session;
  }
}

export const authService = new AuthService();
