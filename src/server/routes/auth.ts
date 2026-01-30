import { Router } from 'express';
import { AuthResponse } from '../../shared/types/api';
import { reddit } from '@devvit/web/server';

const router = Router();

const DEFAULT_AVATAR = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';

/**
 * GET /api/auth
 * Authenticate user and return profile information including karma
 */
router.get<{}, AuthResponse | { status: string; message: string }>(
  '/api/auth',
  async (_req, res): Promise<void> => {
    try {
      const username = await reddit.getCurrentUsername();

      // Check if user is authenticated
      if (!username || username === 'anonymous') {
        res.json({
          type: 'auth',
          authenticated: false,
        });
        return;
      }

      // Get user profile and calculate avatar URL
      const user = await reddit.getCurrentUser();
      const snoovatar = await reddit.getSnoovatarUrl(username);
      const avatarUrl = (user as any)?.icon_img || snoovatar || DEFAULT_AVATAR;

      // Calculate total karma
      const postKarma = user?.linkKarma ?? 0;
      const commentKarma = user?.commentKarma ?? 0;
      const totalKarma = postKarma + commentKarma;

      res.json({
        type: 'auth',
        authenticated: true,
        username,
        userId: user?.id ?? username,
        displayName: user?.username ?? username,
        avatarUrl,
        karma: {
          total: totalKarma,
          post: postKarma,
          comment: commentKarma,
        },
      });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Authentication failed',
      });
    }
  }
);

export const authRouter = router;
