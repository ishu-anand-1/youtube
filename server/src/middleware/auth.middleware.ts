import { Request, Response, NextFunction } from 'express';
import { UserSession } from '@watchtogether/shared';
import { authService } from '../modules/auth/auth.service.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      session?: UserSession;
    }
  }
}

export function extractToken(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check HTTP-only cookie
  if (req.cookies && req.cookies.wt_session) {
    return req.cookies.wt_session;
  }

  // Check custom header
  const customHeader = req.headers['x-session-token'];
  if (typeof customHeader === 'string') {
    return customHeader.trim();
  }

  return null;
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const session = await authService.validateToken(token);
    if (session) {
      req.session = session;
    }
  } catch {
    // Ignore invalid session in optional auth
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication session required',
      },
    });
    return;
  }

  try {
    const session = await authService.validateToken(token);
    if (!session) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Session has expired or is invalid',
        },
      });
      return;
    }

    req.session = session;
    next();
  } catch (err) {
    next(err);
  }
}
