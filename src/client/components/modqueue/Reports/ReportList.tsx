import { Ban, Flag, Grid2x2, Pencil, Trash2, ExternalLink, FlagOff } from 'lucide-react';
import { Report } from '../../../../shared/types/api';
import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '../../LoadingSpinner';

interface ReportListProps {
  reports: Report[];
  listings: {
    id: string;
    categoryId: string;
    category?: string | undefined;
    customCategory?: string | undefined;
  }[];
  categories: { id: string; name: string }[];
  loading?: boolean;
  error?: string | null;
  onRemove?: (report: Report) => void;
  onEdit?: (report: Report) => void;
  onIgnore?: (report: Report) => void;
}

const emptyStateMessage = 'No reports yet. When players report items, they will appear here.';
const ITEMS_PER_PAGE = 20;

export const ReportList = ({
  reports,
  listings = [],
  categories = [],
  loading,
  error,
  onRemove,
  onEdit,
  onIgnore,
}: ReportListProps) => {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && displayCount < reports.length) {
          setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, reports.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, reports.length]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [reports.length]);

  if (loading) {
    return <LoadingSpinner size={40} centered />;
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg border border-red-400/40 bg-red-500/10 text-red-100">
        {error}
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-[#0c0f14] p-4 shadow-inner">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#648EFC1A] text-[#9CC2FF]">
          <Ban size={26} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-white">No reports yet.</p>
          <p className="text-[14px] text-[--color-text-subtle]">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  const visibleReports = reports.slice(0, displayCount);
  const hasMore = displayCount < reports.length;

  // Helper function to get category name for a listing (matches SuggestionList pattern)
  const categoryNameFor = (listing: {
    id: string;
    categoryId: string;
    category?: string | undefined;
    customCategory?: string | undefined;
  }) => {
    if (listing.categoryId === '__others__') {
      return listing.customCategory ? `Others - ${listing.customCategory}` : 'Others';
    }
    return categories.find((c) => c.id === listing.categoryId)?.name ?? 'Uncategorized';
  };

  return (
    <div className="mt-4 space-y-3">
      {visibleReports.map((report) => {
        const imageUrl = report.listingImageUrl;
        const listingName = report.listingName;
        const showActions = report.status === 'action-needed';

        // Find the listing for this report
        const listing = listings.find((l) => l.id === report.listingId);
        const categoryName = listing ? categoryNameFor(listing) : 'Others';

        return (
          <div
            key={report.id}
            className="relative flex flex-col gap-4 rounded-xl border border-gray-500 p-3 sm:p-4 bg-transparent text-[14px]"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-3">
              <div className="relative w-24 h-24 sm:w-24 sm:h-24 aspect-square overflow-hidden rounded-md border-2 border-gray-500 bg-black flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt={listingName} className="h-full w-full object-contain" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[12px] text-slate-400">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[16px] font-semibold text-white flex items-center min-w-0">
                      <span className="truncate">{listingName}</span>
                      <span className="ml-3 flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold border border-red-400/60 bg-red-500/10 text-red-100">
                        Reported
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[14px] text-[--color-text-subtle]">
                      <Grid2x2 size={18} />
                      <span>{categoryName}</span>
                    </div>
                  </div>

                  {showActions && report.status === 'action-needed' && (
                    <div className="flex items-center gap-2 self-start text-slate-300">
                      <button
                        onClick={() => onEdit?.(report)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:text-sky-300 hover:bg-white/10 transition-colors"
                        title="Edit item"
                        aria-label="Edit item"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => onRemove?.(report)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => onIgnore?.(report)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:text-slate-100 hover:bg-white/10 transition-colors"
                        title="Ignore report"
                        aria-label="Ignore report"
                      >
                        <FlagOff size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-[14px] text-[--color-text-subtle]">
                  {report.listingImageUrl && report.listingName && report.listingId && null}
                  {/* Display URL if present, styled like SuggestionList */}
                  {/* Show listing URL if available (from listing object) */}
                  {report.listingUrl && (
                    <div className="mt-1 flex items-center gap-1.5 min-w-0">
                      <ExternalLink size={17} className="flex-shrink-0 text-slate-400" />
                      <a
                        href={report.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 transition-colors truncate hover:underline"
                        title={report.listingUrl}
                      >
                        {report.listingUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-white/15" />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text- mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[14px] font-semibold text-red-300">{report.issue}</p>
                </div>
              </div>

              {report.comment && (
                <div className="flex items-start gap-2">
                  <div className="space-y-1">
                    <p className="text-[14px] text-slate-200 leading-snug break-words">
                      {report.comment}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <button
            onClick={() =>
              setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, reports.length))
            }
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-full border border-white/40 hover:bg-white/5 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};
