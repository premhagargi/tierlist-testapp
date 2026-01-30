import { useCallback, useEffect, useState } from 'react';
import { Report, ReportsResponse, ReportStatus } from '../../shared/types/api';

export type ReportAction = 'remove' | 'edit' | 'ignore';

export const useReports = (appId: string) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reports/${appId}`);
      const data = (await res.json()) as ReportsResponse;

      if (res.ok && data.data) {
        setReports(data.data);
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const updateReport = useCallback(
    async (
      reportId: string,
      action: ReportAction,
      payload?: { issue?: string; comment?: string }
    ) => {
      try {
        const res = await fetch(`/api/reports/${appId}/${reportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload }),
        });

        const data = (await res.json()) as ReportsResponse;
        if (res.ok) {
          setReports((prev) => {
            if (action === 'remove' || action === 'ignore') {
              return prev.filter((r) => r.id !== reportId);
            }
            if (action === 'edit' && data.report) {
              // For edit action, update the report with fresh listing data from server
              return prev.map((r) => (r.id === reportId ? data.report! : r));
            }
            if (data.report) {
              return prev.map((r) => (r.id === reportId ? data.report! : r));
            }
            return prev;
          });
          return data.report ?? null;
        }

        throw new Error(data.message || 'Failed to update report');
      } catch (err) {
        console.error('Error updating report:', err);
        throw err;
      }
    },
    [appId]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const addLocalReport = (report: Report) => {
    setReports((prev) => [report, ...prev]);
  };

  const setStatusLocally = (reportId: string, status: ReportStatus) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
  };

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    updateReport,
    addLocalReport,
    setStatusLocally,
  };
};
