import { scheduler, reddit, redis } from '@devvit/web/server';
import { readAppMeta } from '../routes/mods';

/**
 * Helper to schedule a buffered notification.
 * Call this when a suggestion or report is submitted.
 */
export async function scheduleBufferedNotification(
  postId: string
) {
  const POST_REPORT_COUNTS_KEY = 'post_report_counts';
  const JOB_SCHEDULED_KEY_PREFIX = 'job_scheduled:';

  try {
    // 1. Increment count for this post
    await redis.hIncrBy(POST_REPORT_COUNTS_KEY, postId, 1);

    // 2. Check if a job is already scheduled
    const jobKey = `${JOB_SCHEDULED_KEY_PREFIX}${postId}`;
    const isScheduled = await redis.get(jobKey);

    if (isScheduled) {
      return;
    }

    // 3. Fetch Post Author (needed for DM)
    // First try to get the installer from app metadata
    let authorName: string;
    try {
      const meta = await readAppMeta(postId);
      if (meta && meta.installerUsername) {
        authorName = meta.installerUsername;
      } else {
        // Fallback to post author
        const post = await reddit.getPostById(postId as `t3_${string}`);
        authorName = post.authorName;
      }
    } catch (err) {
       console.error(`[Scheduler Debug] Error reading AppMeta:`, err);
       // Fallback to post author if meta read fails
       const post = await reddit.getPostById(postId as `t3_${string}`);
       authorName = post.authorName;
    }

    // 4. Schedule Job with Jitter (0-60 minutes)
    const now = new Date();
    const jitterMinutes = Math.floor(Math.random() * 60);
    const scheduledTime = new Date(now.getTime() + (24 * 60 + jitterMinutes) * 60 * 1000);
      // const scheduledTime = new Date(now.getTime() + 30 * 1000);

      await scheduler.runJob({
        name: 'TIER_LIST_SUMMARY_DM',
        data: { postId, authorName },
        runAt: scheduledTime,
      });

    // 5. Lock the job to prevent duplicates
    await redis.set(jobKey, 'true', { expiration: new Date(now.getTime() + 26 * 60 * 60 * 1000) });

  } catch (error) {
    console.error(`[Scheduler] Failed to schedule notification for ${postId}:`, error);
  }
}
