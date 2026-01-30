import { Router } from 'express';
import { reddit, redis } from '@devvit/web/server';
import { AppMetaResponse } from '../../shared/types/api';

interface AppMeta {
  appId: string;
  subreddit: string;
  installerId: string;
  installerUsername: string;
  createdAt: string;
  postUrl?: string;
  subredditId?: string;
}

const router = Router();

const META_KEY_PREFIX = 'app:meta';
const metaKey = (appId: string) => `${META_KEY_PREFIX}:${appId}`;

const readMeta = async (appId: string): Promise<AppMeta | null> => {
  const raw = await redis.get(metaKey(appId));
  if (!raw) return null;
  return JSON.parse(raw) as AppMeta;
};

const writeMeta = async (meta: AppMeta): Promise<void> => {
  await redis.set(metaKey(meta.appId), JSON.stringify(meta));
};

router.get<{ appId: string }, AppMetaResponse>('/api/app', async (req, res): Promise<void> => {
  try {
    const subreddit = await reddit.getCurrentSubreddit();
    if (!subreddit?.name) {
      res.status(400).json({ status: 'error', message: 'Unable to detect subreddit', appId: '' });
      return;
    }

    const user = await reddit.getCurrentUser();
    const installerId = user?.id || subreddit.name;
    const installerUsername = user?.username || subreddit.name;

    // Strictly require postId for unique post instances
    const postId = req.query.postId as string;

    if (!postId) {
      console.warn('[Server] GET /api/app - Missing postId query param');
      res
        .status(400)
        .json({ status: 'error', message: 'Missing postId query parameter', appId: '' });
      return;
    }

    const appId = postId;
    let meta = await readMeta(appId);

    if (!meta) {
      // If meta is missing for a specific post ID, it might be an old post or an error.
      // We can return a default structure or error. Returning default for robustness.
      meta = {
        appId,
        subreddit: subreddit.name,
        installerId,
        installerUsername,
        createdAt: new Date().toISOString(),
        subredditId: subreddit.id,
      };
      // We do NOT write this back automatically to avoid cluttering DB with phantom keys
      // if invalid IDs are probed.
    }

    const response: AppMetaResponse = {
      status: 'success',
      appId: meta.appId,
      subreddit: meta.subreddit,
      subredditId: meta.subredditId ?? subreddit.id,
      installerId: meta.installerId,
      installerUsername: meta.installerUsername,
      createdAt: meta.createdAt,
      ...(meta.postUrl ? { postUrl: meta.postUrl } : {}),
    };

    res.json(response);
  } catch (error) {
    console.error('Error resolving app metadata:', error);
    res.status(500).json({ status: 'error', message: 'Failed to resolve app metadata', appId: '' });
  }
});

// --- Internal Routes for Devvit Actions ---

// --- Internal Routes for Devvit Actions ---

router.post('/internal/menu/post-create', async (_req, res) => {
  res.json({
    showForm: {
      name: 'postCreateForm',
      form: {
        title: 'Create Tierlist',
        fields: [
          {
            name: 'title',
            label: 'Post Title (max 300 characters)',
            type: 'string',
            required: true,
            helpText: 'Eg: Marvel Movie Tier List, Best Football Players, Every Pokémon Ranked',
          },
          {
            name: 'shortDescription',
            label: 'Short Description (max 100 characters)',
            type: 'string',
            helpText: 'Eg: Top Movies 2025.',
          },
          {
            name: 'callToAction',
            label: 'Call To Action (max 100 characters)',
            type: 'string',
            helpText: 'Eg: Vote for your favorite movies. You can change it later in Settings.',
          },
          {
            name: 'votingExpiry',
            label: 'Voting closes',
            type: 'select',
            required: true,
            defaultValue: 'never',
            helpText:
              'Select a voting window or choose Never Expires. You can change it later in Settings',
            options: [
              { label: 'Never expires', value: 'never' },
              { label: '1 day', value: '1day' },
              { label: '3 days', value: '3days' },
              { label: '1 week', value: '1week' },
              { label: '2 weeks', value: '2weeks' },
              { label: '4 weeks', value: '4weeks' },
            ],
          },
        ],
        acceptLabel: 'Create',
        cancelLabel: 'Cancel',
      },
    },
  });
});

import { saveMiscSettings } from './misc';

router.post('/internal/form/post-create-submit', async (req, res) => {
  try {
    const values = req.body.values || req.body;
    let { title, shortDescription, callToAction } = values || {};

    // Truncate to 120 characters if longer
    if (typeof shortDescription === 'string') {
      shortDescription = shortDescription.slice(0, 120);
    }
    if (typeof callToAction === 'string') {
      callToAction = callToAction.slice(0, 120);
    }

    // Extract votingExpiry - handle if it comes as an array
    let votingExpiry = values.votingExpiry;
    if (Array.isArray(votingExpiry)) {
      votingExpiry = votingExpiry[0];
    }

    if (!title) {
      res.json({ showToast: 'Title is required' });
      return;
    }

    if (title.length > 300) {
      res.json({ showToast: 'Title must be 300 characters or less' });
      return;
    }
    if (typeof shortDescription === 'string' && shortDescription.length > 120) {
      res.json({ showToast: 'Short description must be 120 characters or less' });
      return;
    }
    if (typeof callToAction === 'string' && callToAction.length > 120) {
      res.json({ showToast: 'Call to action must be 120 characters or less' });
      return;
    }

    // Calculate expiry date based on votingExpiry selection
    let expiryDate: string | null = null;

    if (votingExpiry && votingExpiry !== 'never') {
      const now = new Date();

      // Set to end of day (23:59 UTC) for the expiry date
      let targetDate: Date;
      switch (votingExpiry) {
        case '1day':
          targetDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 23, 59, 0, 0)
          );
          break;
        case '3days':
          targetDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 3, 23, 59, 0, 0)
          );
          break;
        case '1week':
          targetDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 23, 59, 0, 0)
          );
          break;
        case '2weeks':
          targetDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 14, 23, 59, 0, 0)
          );
          break;
        case '4weeks':
          targetDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 28, 23, 59, 0, 0)
          );
          break;
        default:
          targetDate = now;
      }
      expiryDate = targetDate.toISOString();
    }

    const subreddit = await reddit.getCurrentSubreddit();
    const user = await reddit.getCurrentUser();

    // 1. Create the post first to generate the unique ID
    const post = await reddit.submitCustomPost({
      runAs: 'USER',
      title,
      subredditName: subreddit.name,
      preview: {
        title,
        body: shortDescription,
      },
      userGeneratedContent: {
        text: `${title}`,
      },
    } as any);

    // 2. Immediately approve the post to make it public
    await reddit.approve(post.id);

    // 3. Use the new post.id as the unique appId for storage
    const uniqueAppId = post.id;

    // Fetch subreddit icon for default splash icon
    let appIconUri = '';
    try {
      const subData = await reddit.getSubredditById(subreddit.id);
      if (subData) {
        // Cast to any to access properties that might be missing in strict types
        const rawSub = subData as any;
        appIconUri = rawSub.communityIcon || rawSub.iconImg || '';
      }
    } catch (e) {
      console.warn('Failed to fetch subreddit icon for splash default', e);
    }

    // Save game settings keyed by post.id
    await saveMiscSettings(uniqueAppId, {
      title,
      shortDescription,
      callToAction,
      expiryDate,
      subredditId: subreddit.id,
      createdAt: Date.now(),
      appIconUri,
      backgroundColor: '#0E1113', // Default dark theme
    });

    // 3. Write metadata for this specific instance
    await writeMeta({
      appId: uniqueAppId,
      subreddit: subreddit.name,
      installerId: user?.id || 'unknown',
      installerUsername: user?.username || 'unknown',
      createdAt: new Date().toISOString(),
      postUrl: post.url,
      subredditId: subreddit.id,
    });

    res.json({
      navigateTo: post.url,
      showToast: 'Tier List Post Created',
    });
  } catch (error) {
    console.error('Error creating post:', error);
    let msg = 'Unknown error';
    if (error instanceof Error) msg = error.message;
    res.json({ showToast: `Error: ${msg}` });
  }
});

export const appRouter = router;
