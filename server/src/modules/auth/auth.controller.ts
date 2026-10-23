import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

const createSessionSchema = z.object({
  displayName: z.string().trim().min(2).max(30),
});

router.post('/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName } = createSessionSchema.parse(req.body);
    const { session, rawToken } = await authService.createGuestSession(displayName);

    // Set secure HTTP-only cookie
    res.cookie('wt_session', rawToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        userId: session.userId,
        displayName: session.displayName,
        token: rawToken,
        createdAt: session.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      userId: req.session!.userId,
      displayName: req.session!.displayName,
      token: req.session!.token,
      createdAt: req.session!.createdAt,
    },
  });
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('wt_session');
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

export const authRouter = router;
