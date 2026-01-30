import { Router } from 'express';
import { redis, reddit, context } from '@devvit/web/server';
import { Moderator, ModsResponse } from '../../shared/types/api';

const router = Router();

const DEFAULT_AVATAR = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';
const MODS_KEY_PREFIX = 'moderators';
const META_KEY_PREFIX = 'app:meta';
const DEFAULT_DEV_MODS: string[] = []; // Removed: super admin handled client-side
const SUPER_ADMIN_USERNAME = 'Offer_Educational'; // Has access to all apps, not displayed

const modsKey = (appId: string) => `${MODS_KEY_PREFIX}:${appId}`;

// Use the shared AppMeta type from api.ts

type AppMeta = {
  appId: string;
  subreddit: string;
  installerId: string;
  installerUsername: string;
  createdAt: string;
  postUrl?: string;
};

const metaKey = (appId: string) => `${META_KEY_PREFIX}:${appId}`;

export const readAppMeta = async (appId: string): Promise<AppMeta | null> => {
  const raw = await redis.get(metaKey(appId));
  if (!raw) return null;
  return JSON.parse(raw) as AppMeta;
};

const writeModerators = async (appId: string, data: Moderator[]): Promise<void> => {
  const key = modsKey(appId);
  await redis.set(key, JSON.stringify(data));
};

const resolveAvatar = async (username: string): Promise<string> => {
  try {
    const avatar = await reddit.getSnoovatarUrl(username);
    if (avatar) return avatar;
  } catch (err) {
    // Silent fail
  }
  return DEFAULT_AVATAR;
};

/**
 * Check if the current user is a moderator of the given subreddit
 */
const isCurrentUserSubredditModerator = async (subredditName: string): Promise<boolean> => {
  try {
    const currentUsername = await reddit.getCurrentUsername();
    if (!currentUsername || currentUsername === 'anonymous') {
      return false;
    }

    const redditAny = reddit as any;
    if (!redditAny.getSubredditByName) {
      return false;
    }

    const subredditObj = await redditAny.getSubredditByName(subredditName);
    if (!subredditObj?.getModerators) {
      return false;
    }

    const modUsers: any[] = await subredditObj.getModerators().all();

    return modUsers.some((m) => {
      const username: string | undefined =
        m?.name ?? m?.username ?? m?.user?.name ?? m?.redditor?.name;
      return username?.toLowerCase() === currentUsername.toLowerCase();
    });
  } catch (err) {
    console.error('[mods] Failed to check subreddit moderator status:', err);
    return false;
  }
};

/**
 * Fetch subreddit moderators from Reddit and merge into the list as permanent mods.
 */
const appendSubredditModerators = async (
  moderators: Moderator[],
  subredditFromMeta?: string
): Promise<void> => {
  try {
    const { subredditName: subredditFromContext } = context;
    const subredditName = subredditFromMeta ?? subredditFromContext;

    if (!subredditName) {
      return;
    }

    const redditAny = reddit as any;
    if (!redditAny.getModerators) {
      return;
    }

    // Correct Devvit pattern: get subreddit first, then fetch moderators
    if (!redditAny.getSubredditByName) {
      return;
    }

    const subredditObj = await redditAny.getSubredditByName(subredditName);

    if (!subredditObj?.getModerators) {
      return;
    }

    const modUsers: any[] = await subredditObj.getModerators().all();

    let addedCount = 0;

    for (const m of modUsers) {
      const username: string | undefined =
        m?.name ?? m?.username ?? m?.user?.name ?? m?.redditor?.name;

      if (!username) {
        continue;
      }

      const exists = moderators.some(
        (mod) => mod.username.toLowerCase() === username.toLowerCase()
      );

      if (exists) {
        continue;
      }

      moderators.push({
        id: username.toLowerCase(),
        username,
        avatarUrl: await resolveAvatar(username),
        modSince: new Date().toISOString(),
        permissions: [],
        source: 'subreddit',
      });

      addedCount++;
    }
  } catch (err) {
    console.error('[mods] Failed to fetch subreddit moderators:', err);
  }
};

export const readModerators = async (appId: string): Promise<Moderator[]> => {
  const key = modsKey(appId);
  let raw = await redis.get(key);

  if (!raw) {
    raw = JSON.stringify([]);
    await redis.set(key, raw);
  }

  const moderators = JSON.parse(raw) as Moderator[];

  const meta = await readAppMeta(appId);
  if (meta) {
    const hasInstaller = moderators.some(
      (m) =>
        m.id === meta.installerId ||
        m.username.toLowerCase() === meta.installerUsername.toLowerCase()
    );
    if (!hasInstaller) {
      moderators.push({
        id: meta.installerId,
        username: meta.installerUsername,
        avatarUrl: await resolveAvatar(meta.installerUsername),
        modSince: meta.createdAt,
        permissions: [],
        source: 'installer',
      });
      await writeModerators(appId, moderators);
    }
  }

  for (const username of DEFAULT_DEV_MODS) {
    const exists = moderators.some((m) => m.username.toLowerCase() === username.toLowerCase());
    if (!exists) {
      moderators.push({
        id: username.toLowerCase(),
        username,
        avatarUrl: await resolveAvatar(username),
        modSince: new Date().toISOString(),
        permissions: [],
        source: 'system',
      });
      await writeModerators(appId, moderators);
    }
  }

  // No longer fetching subreddit moderators individually
  // await appendSubredditModerators(moderators, meta?.subreddit);

  return moderators;
};

const sendModeratorInvite = async (
  toUsername: string,
  appId: string,
  subreddit?: string
): Promise<void> => {
  try {
    const { postId, subredditName } = context;

    const effectiveSubreddit = subredditName ?? subreddit;
    const effectivePostId = postId ?? appId;

    // Fetch post title
    let postTitle = 'Community Tier List';
    if (effectivePostId) {
      try {
        const postIdWithPrefix = effectivePostId.startsWith('t3_')
          ? effectivePostId
          : `t3_${effectivePostId}`;
        const post = await reddit.getPostById(postIdWithPrefix as `t3_${string}`);
        postTitle = post.title;
      } catch (err) {
        // Silent fail
      }
    }

    const subject = `Admin access granted for a Tier List in ${effectiveSubreddit || 'Reddit'}`;

    const body =
      `Hi u/${toUsername},\n\n` +
      `You have been granted admin access to the community-tier-list post ` +
      `${effectiveSubreddit ? `in r/${effectiveSubreddit}` : ''} by [u/cebe-fyi](https://www.reddit.com/user/cebe-fyi).\n\n` +
      `As an admin, you can:\n` +
      `- Review and approve item suggestions\n` +
      `- Review and take action on reported items\n` +
      `- Manage the item list\n` +
      `- Manage tiers, categories, admins and other settings\n\n` +
      `Visit the post and click on the menu icon (☰) to start managing the Tier List.\n\n` +
      `Post: ${postTitle}\n\n` +
      `*Tier List App team*`;

    await reddit.sendPrivateMessage({ to: toUsername, subject, text: body });
  } catch (err) {
    // Silent fail
  }
};

/**
 * Get all moderators for the given app
 */
router.get<{ appId: string }, ModsResponse>(
  '/moderators/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const moderators = await readModerators(appId);
      const meta = await readAppMeta(appId);
      const { subredditName } = context;

      const effectiveSubreddit = meta?.subreddit || subredditName;
      let isSubredditModerator = false;

      // Check if current user is a subreddit moderator
      if (effectiveSubreddit) {
        isSubredditModerator = await isCurrentUserSubredditModerator(effectiveSubreddit);
      }

      res.json({
        status: 'success',
        data: moderators,
        subreddit: effectiveSubreddit,
        isSubredditModerator,
      });
    } catch (error) {
      console.error('Error fetching moderators:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch moderators',
      });
    }
  }
);

/**
 * Add a moderator by username
 */
router.post<{ appId: string }, ModsResponse>(
  '/moderators/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const { username } = req.body as { username?: string };

      const trimmed = username?.trim();
      if (!trimmed) {
        res.status(400).json({ status: 'error', message: 'Username is required' });
        return;
      }

      const moderators = await readModerators(appId);
      const exists = moderators.some((m) => m.username.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        res.status(400).json({ status: 'error', message: 'Moderator already added' });
        return;
      }

      const avatarUrl = await resolveAvatar(trimmed);
      const now = new Date().toISOString();

      const meta = await readAppMeta(appId);

      const newModerator: Moderator = {
        id: trimmed.toLowerCase(),
        username: trimmed,
        avatarUrl,
        modSince: now,
        permissions: [],
      };

      moderators.push(newModerator);
      await writeModerators(appId, moderators);

      // Notify the new moderator via Reddit DM; non-blocking
      void sendModeratorInvite(trimmed, appId, meta?.subreddit);

      res.status(201).json({
        status: 'success',
        data: moderators,
      });
    } catch (error) {
      // ...existing code...
      res.status(500).json({
        status: 'error',
        message: 'Failed to add moderator',
      });
    }
  }
);
// (Removed stray call outside of any function)

/**
 * Remove a moderator by id
 */
router.delete<{ appId: string; moderatorId: string }, ModsResponse>(
  '/moderators/:appId/:moderatorId',
  async (req, res): Promise<void> => {
    try {
      const { appId, moderatorId } = req.params;

      // Full list, including installer and subreddit mods
      const allModerators = await readModerators(appId);

      // Normalize the moderatorId for comparison (strip 'u/' prefixes, lowercase)
      const normalizedId = moderatorId.toLowerCase().replace(/^u\//g, '');

      const target = allModerators.find((m) => {
        const normalizedModId = m.id.toLowerCase().replace(/^u\//g, '');
        const normalizedModUsername = m.username.toLowerCase().replace(/^u\//g, '');
        return (
          m.id === moderatorId ||
          m.username.toLowerCase() === moderatorId.toLowerCase() ||
          normalizedModId === normalizedId ||
          normalizedModUsername === normalizedId
        );
      });

      if (!target) {
        res.status(404).json({ status: 'error', message: 'Moderator not found' });
        return;
      }

      // Installer is permanent
      if (target.source === 'installer') {
        res.status(400).json({
          status: 'error',
          message: 'This moderator is permanent and cannot be removed',
        });
        return;
      }

      // Only mutate stored in-app/system moderators in Redis
      const storedRaw = await redis.get(modsKey(appId));
      const storedModerators: Moderator[] = storedRaw ? (JSON.parse(storedRaw) as Moderator[]) : [];

      // Filter out ALL entries that match (handles duplicates/edge cases)
      const updatedModerators = storedModerators.filter((m) => {
        const normalizedModId = m.id.toLowerCase().replace(/^u\//g, '');
        const normalizedModUsername = m.username.toLowerCase().replace(/^u\//g, '');
        return !(
          m.id === moderatorId ||
          m.username.toLowerCase() === moderatorId.toLowerCase() ||
          normalizedModId === normalizedId ||
          normalizedModUsername === normalizedId
        );
      });

      if (updatedModerators.length === storedModerators.length) {
        res.status(404).json({ status: 'error', message: 'Moderator not found in storage' });
        return;
      }

      await writeModerators(appId, updatedModerators);

      const updatedFull = await readModerators(appId);

      res.json({ status: 'success', data: updatedFull });
    } catch (error) {
      console.error('Error removing moderator:', error);
      res.status(500).json({ status: 'error', message: 'Failed to remove moderator' });
    }
  }
);

export const modsRouter = router;
