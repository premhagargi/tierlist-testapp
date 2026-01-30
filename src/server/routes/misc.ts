import { Router } from 'express';
import { redis } from '@devvit/web/server';

const router = Router();

const MISC_KEY_PREFIX = 'misc';

const getMiscKey = (appId: string) => `${MISC_KEY_PREFIX}:${appId}`;

export interface MiscSettings {
  title?: string;
  description?: string;
  callToAction?: string;
  shortDescription?: string;
  expiryDate?: string | null;
  subredditId?: string;
  createdAt?: number;
  appIconUri?: string;
  backgroundColor?: string;
  autoApproveSuggestions?: boolean;
  featuredItemId?: string | null;
  featuredItem?: {
    id: string;
    name: string;
    imageUrl?: string;
    categoryId?: string;
    category?: string;
    url?: string;
  } | null;
}

export interface MiscResponse {
  status: 'success' | 'error';
  data?: MiscSettings;
  message?: string;
}

/**
 * Get misc settings for a specific app
 */
/**
 * Get misc settings for a specific app
 */
router.get<{ appId: string }, MiscResponse>('/misc/:appId', async (req, res): Promise<void> => {
  try {
    const { appId } = req.params;
    const miscKey = getMiscKey(appId);

    const miscData = await redis.get(miscKey);
    if (!miscData) {
      res.json({
        status: 'success',
        data: {
          callToAction: 'Vote for your favorite movies of 2025',
          shortDescription: 'Top Movies 2025',
          expiryDate: null,
          appIconUri: '',
          backgroundColor: '#0E1113',
          autoApproveSuggestions: false,
        },
      });
      return;
    }

    const parsed = JSON.parse(miscData) as MiscSettings;
    res.json({
      status: 'success',
      data: parsed,
    });
  } catch (error) {
    console.error('[Server] Error fetching misc settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch misc settings',
    });
  }
});

export const saveMiscSettings = async (
  appId: string,
  settings: Partial<MiscSettings>,
  redisClient: any = redis
): Promise<MiscSettings> => {
  const miscKey = getMiscKey(appId);
  const existingData = await redisClient.get(miscKey);
  const existing: MiscSettings = existingData
    ? JSON.parse(existingData)
    : {
        callToAction: '',
        shortDescription: '',
        expiryDate: null,
        appIconUri: '',
        backgroundColor: '#0E1113',
        autoApproveSuggestions: true,
      };

  const updated: MiscSettings = {
    ...existing,
    ...settings,
  };

  await redisClient.set(miscKey, JSON.stringify(updated));
  return updated;
};

/**
 * Update misc settings for a specific app
 */
router.post<{ appId: string }, MiscResponse>('/misc/:appId', async (req, res): Promise<void> => {
  try {
    const { appId } = req.params;
    const { callToAction, shortDescription, expiryDate, autoApproveSuggestions, featuredItemId, featuredItem } =
      req.body as Partial<MiscSettings>;

    // Use the shared helper
    const updated = await saveMiscSettings(appId, {
      ...(callToAction !== undefined && { callToAction }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(expiryDate !== undefined && { expiryDate }),
      ...(autoApproveSuggestions !== undefined && { autoApproveSuggestions }),
      ...(featuredItemId !== undefined && { featuredItemId }),
      ...(featuredItem !== undefined && { featuredItem }),
    });

    res.json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    console.error('[Server] Error updating misc settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update misc settings',
    });
  }
});

export const miscRouter = router;
