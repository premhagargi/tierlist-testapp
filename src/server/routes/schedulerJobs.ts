import { Router } from 'express';
import { reddit, redis } from '@devvit/web/server';
import { readSuggestions } from './suggestions';
import { readReports } from './reports';

const router = Router();

/**
 * Sends a summary DM to the post author about new suggestions/reports.
 * Mirrors the pattern in mods.ts to ensure proper context handling.
 */
const sendSummaryDM = async (
  authorName: string,
  postId: string,
  flaggedCount: number,
  suggestedCount: number
): Promise<void> => {
  try {
    // 1. Fetch post details
    const postIdWithPrefix = postId.startsWith('t3_') ? postId : `t3_${postId}`;
    const post = await reddit.getPostById(postIdWithPrefix as `t3_${string}`);
    const title = post.title;
    const permalink = post.permalink;
    const subredditName = post.subredditName;

    // 2. Construct and send DM
    const subject = `Action Required: Pending Items in Your Tier List (r/${subredditName})`;
    const url = `https://www.reddit.com${permalink}`;
    
    const text =
      `There are a few pending actions on your Tier List post in the [r/${subredditName}](https://www.reddit.com/r/${subredditName}/) subreddit.\n\n` +
      `- **Flagged items pending review:** ${flaggedCount}\n` +
      `- **Suggested items awaiting approval:** ${suggestedCount}\n\n` +
      `You are receiving this message because you are an admin of this Tier List post.\n\n` +
      `Visit the post and click the menu icon (☰) to manage the Tier List.\n\n` +
      `**Post link:** [${title}](${url})\n\n` +
      `—\n\n` +
      `*Tier List App Team*`;

    console.log(`[Scheduler] Attempting to send DM to ${authorName} as App Context...`);
    console.log(`[Scheduler Job Debug] Received authorName: ${authorName}`);
    await reddit.sendPrivateMessage({
      to: authorName,
      subject,
      text,
    });
    console.log(`[Scheduler] Successfully sent summary DM to ${authorName}`);
  } catch (error) {
    console.error(`[Scheduler] Error sending DM to ${authorName}:`, error);
  }
};

// Handle TIER_LIST_SUMMARY_DM scheduled job
router.post('/internal/scheduler/tier-list-summary-dm', async (req, res) => {
  console.log('[Scheduler] TIER_LIST_SUMMARY_DM job triggered');
  
  // Devvit sends job data wrapped in a structure: { name, data: { postId, authorName } }
  const jobData = req.body.data || req.body;
  const { postId, authorName } = jobData as { postId: string; authorName: string };
  const POST_REPORT_COUNTS_KEY = 'post_report_counts';
  const JOB_SCHEDULED_KEY_PREFIX = 'job_scheduled:';

  if (!postId || !authorName) {
    console.error('[Scheduler] Job missing postId or authorName', req.body);
    return res.status(400).json({ error: 'Missing postId or authorName' });
  }

  try {
    // Fetch actual pending counts
    const suggestions = await readSuggestions(postId);
    const reports = await readReports(postId);

    const suggestedCount = suggestions.filter(s => s.status === 'pending').length;
    const flaggedCount = reports.filter(r => r.status === 'action-needed').length;

    if (suggestedCount > 0 || flaggedCount > 0) {
      // Use the helper to send the DM
      await sendSummaryDM(authorName, postId, flaggedCount, suggestedCount);
    } else {
      console.log(`[Scheduler] No pending items for ${postId}. Skipping DM.`);
    }

    // Cleanup Redis keys
    await redis.hDel(POST_REPORT_COUNTS_KEY, [postId]);
    await redis.del(`${JOB_SCHEDULED_KEY_PREFIX}${postId}`);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error(`[Scheduler] Error running TIER_LIST_SUMMARY_DM for ${postId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle SEND_SUMMARY_DM (old jobs cleanup)
router.post('/internal/scheduler/send-summary-dm', async (req, res) => {
  console.log('[Scheduler] Catching orphaned SEND_SUMMARY_DM job. No action taken.');
  console.log('[Scheduler] Event data:', JSON.stringify(req.body));
  
  const jobData = req.body.data || req.body;
  const { postId } = jobData as { postId?: string };
  if (postId) {
    try {
      const POST_REPORT_COUNTS_KEY = 'post_report_counts';
      const JOB_SCHEDULED_KEY_PREFIX = 'job_scheduled:';
      await redis.hDel(POST_REPORT_COUNTS_KEY, [postId]);
      await redis.del(`${JOB_SCHEDULED_KEY_PREFIX}${postId}`);
      console.log(`[Scheduler] Cleaned up orphaned job data for post ${postId}`);
    } catch (error) {
      console.error('[Scheduler] Error cleaning up orphaned job:', error);
    }
  }
  
  res.status(200).json({ status: 'ok' });
});

export { router as schedulerJobRouter };
