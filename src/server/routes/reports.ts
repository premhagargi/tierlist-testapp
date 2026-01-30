import { Router } from 'express';
import { redis } from '@devvit/web/server';
import { scheduleBufferedNotification } from '../helpers/notifications';
import { Report, ReportsResponse } from '../../shared/types/api';

const router = Router();

const REPORTS_KEY_PREFIX = 'reports';
const getReportsKey = (appId: string) => `${REPORTS_KEY_PREFIX}:${appId}`;

const LISTINGS_KEY_PREFIX = 'listings';
const getListingsKey = (appId: string) => `${LISTINGS_KEY_PREFIX}:${appId}`;

export const readReports = async (appId: string): Promise<Report[]> => {
  const key = getReportsKey(appId);
  let data = await redis.get(key);

  if (!data) {
    data = JSON.stringify([]);
    await redis.set(key, data);
  }

  return JSON.parse(data) as Report[];
};

const writeReports = async (appId: string, reports: Report[]): Promise<void> => {
  const key = getReportsKey(appId);
  await redis.set(key, JSON.stringify(reports));
};

const readListings = async (appId: string) => {
  const key = getListingsKey(appId);
  let data = await redis.get(key);

  if (!data) {
    data = JSON.stringify([]);
    await redis.set(key, data);
  }

  return JSON.parse(data) as Array<{
    id: string;
    name?: string;
    imageUrl?: string;
    category?: string;
    url?: string;
  }>;
};

const writeListings = async (
  appId: string,
  listings: Array<{
    id: string;
    name?: string;
    imageUrl?: string;
    category?: string;
    url?: string;
  }>
) => {
  const key = getListingsKey(appId);
  await redis.set(key, JSON.stringify(listings));
};

router.get<{ appId: string }, ReportsResponse>(
  '/reports/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const reports = await readReports(appId);
      // Filter to only return action-needed reports and clean up storage
      const pendingReports = reports.filter(
        (report) => (report.status as string) === 'action-needed' || !report.status
      );
      if (pendingReports.length !== reports.length) {
        await writeReports(appId, pendingReports);
      }
      // Fetch listings to get updated listing data
      const listings = await readListings(appId);
      const listingsById = Object.fromEntries(listings.map((l: any) => [l.id, l]));
      // Attach fresh listing data to each report
      const reportsWithFreshListingData = pendingReports.map((report) => {
        const listing = listingsById[report.listingId];
        if (listing) {
          return {
            ...report,
            listingName: listing.name,
            listingImageUrl: listing.imageUrl,
            category: listing.category,
            listingUrl: listing.url || report.listingUrl,
          };
        }
        return report;
      });
      res.json({ status: 'success', data: reportsWithFreshListingData });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
    }
  }
);

router.post<{ appId: string }, ReportsResponse>(
  '/reports/:appId',
  async (req, res): Promise<void> => {
    try {
      const { appId } = req.params;
      const {
        listingId,
        listingName,
        listingImageUrl,
        category,
        issue,
        comment,
        reporterId,
        reporterName,
      } = req.body as {
        listingId?: string;
        listingName?: string;
        listingImageUrl?: string;
        category?: string;
        issue?: string;
        comment?: string;
        reporterId?: string;
        reporterName?: string;
      };

      if (!listingId || !listingId.trim()) {
        res.status(400).json({ status: 'error', message: 'listingId is required' });
        return;
      }
      if (!issue || !issue.trim()) {
        res.status(400).json({ status: 'error', message: 'issue is required' });
        return;
      }

      if (!reporterId || !reporterId.trim()) {
        res.status(400).json({ status: 'error', message: 'reporterId is required' });
        return;
      }

      const reports = await readReports(appId);

      const alreadyReported = reports.some(
        (r) => r.listingId === listingId.trim() && r.reporterId === reporterId.trim()
      );

      if (alreadyReported) {
        res.status(409).json({ status: 'error', message: 'You have already reported this item' });
        return;
      }

      const now = new Date().toISOString();

      const report: Report = {
        id: `report-${Date.now()}`,
        appId,
        reporterId: reporterId.trim(),
        ...(reporterName?.trim() && { reporterName: reporterName.trim() }),
        listingId: listingId.trim(),
        ...(listingName?.trim() && { listingName: listingName.trim() }),
        ...(listingImageUrl?.trim() && { listingImageUrl: listingImageUrl.trim() }),
        ...(category?.trim() && { category: category.trim() }),
        issue: issue.trim(),
        ...(comment?.trim() && { comment: comment.trim() }),
        status: 'action-needed',
        createdAt: now,
      };

      reports.unshift(report);
      await writeReports(appId, reports);

      // Trigger buffered notification
      await scheduleBufferedNotification(appId);

      res.status(201).json({ status: 'success', report });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create report' });
    }
  }
);

router.put<{ appId: string; reportId: string }, ReportsResponse>(
  '/reports/:appId/:reportId',
  async (req, res): Promise<void> => {
    try {
      const { appId, reportId } = req.params;
      const { action, issue, comment } = req.body as {
        action?: 'remove' | 'edit' | 'ignore';
        issue?: string;
        comment?: string;
      };

      if (!action) {
        res.status(400).json({ status: 'error', message: 'action is required' });
        return;
      }

      const reports = await readReports(appId);
      const index = reports.findIndex((r) => r.id === reportId);

      if (index === -1) {
        res.status(404).json({ status: 'error', message: 'Report not found' });
        return;
      }

      const report = reports[index];

      if (action === 'edit') {
        if (!issue || !issue.trim() || !comment || !comment.trim()) {
          res.status(400).json({ status: 'error', message: 'issue and comment are required' });
          return;
        }
        if (report) {
          report.issue = issue.trim();
          report.comment = comment.trim();
          report.status = 'action-needed';
          delete report.actionTaken;
          delete report.resolvedAt;

          // Fetch updated listing data
          const listings = await readListings(appId);
          const listing = listings.find((l) => l.id === report.listingId);
          if (listing) {
            if (listing.name) report.listingName = listing.name;
            if (listing.imageUrl) report.listingImageUrl = listing.imageUrl;
            if (listing.category) report.category = listing.category;
            if (listing.url) report.listingUrl = listing.url;
          }

          reports[index] = report;
          await writeReports(appId, reports);
          res.json({ status: 'success', report });
          return;
        }
      } else if (action === 'remove') {
        // Delete the listing associated with this report
        const listings = await readListings(appId);
        if (report) {
          const exists = listings.some((l) => l.id === report.listingId);
          if (exists) {
            const remaining = listings.filter((l) => l.id !== report.listingId);
            await writeListings(appId, remaining);
          }
          const removed = reports.splice(index, 1)[0] as Report;
          await writeReports(appId, reports);
          res.json({ status: 'success', report: removed });
          return;
        }
      } else if (action === 'ignore') {
        if (report) {
          const removed = reports.splice(index, 1)[0] as Report;
          await writeReports(appId, reports);
          res.json({ status: 'success', report: removed });
          return;
        }
      }
      res.status(400).json({ status: 'error', message: 'Unsupported action' });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update report' });
    }
  }
);

export const reportsRouter = router;
