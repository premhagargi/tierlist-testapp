import { Router } from 'express';
import { context } from '@devvit/web/server';

const router = Router();

router.get('/api/init', async (_req, res) => {
  const { postId, subredditId, subredditName } = context;

  if (!postId) {
    return res.status(400).json({
      status: 'error',
      message: 'postId missing from context — ensure app runs on Reddit',
    });
  }

  res.json({
    postId,
    subredditId,
    subredditName,
  });
});

export const initRouter = router;
