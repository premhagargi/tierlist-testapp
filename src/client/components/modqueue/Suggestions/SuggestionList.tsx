import { Ban, ExternalLink, Pencil, CircleCheck, XCircle, Grid2X2 } from 'lucide-react';
import { Suggestion } from '../../../../shared/types/api';
import { Category } from '../../../../shared/types/api';
import { LoadingSpinner } from '../../LoadingSpinner';
import { useEffect, useRef, useState } from 'react';

export type SuggestionSubTab = 'all' | 'pending' | 'approved' | 'rejected';

interface SuggestionListProps {
  suggestions: Suggestion[];
  categories: Category[];
  activeTab: SuggestionSubTab;
  loading: boolean;
  error: string | null;
  onApprove?: (id: string) => Promise<void> | void;
  onReject?: (id: string) => Promise<void> | void;
  onEdit?: (suggestion: Suggestion) => void;
  showActions?: boolean;
}

const emptyStateMessage: Record<SuggestionSubTab, string> = {
  all: 'No suggestions yet.',
  pending: 'No pending suggestions.',
  approved: 'No approved suggestions.',
  rejected: 'No rejected suggestions.',
};

const ITEMS_PER_PAGE = 20;

export const SuggestionList = ({
  suggestions,
  categories,
  activeTab,
  loading,
  error,
  onApprove,
  onReject,
  onEdit,
  showActions = true,
}: SuggestionListProps) => {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeTab === 'all' ? suggestions : suggestions.filter((s) => s.status === activeTab);

  // Sort by date, newest first
  // For approved/rejected tabs, sort by updatedAt (when status changed)
  // For all/pending tabs, sort by createdAt (when suggestion was created)
  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateField =
      activeTab === 'approved' || activeTab === 'rejected' ? 'updatedAt' : 'createdAt';
    return new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime();
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && displayCount < sortedFiltered.length) {
          setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, sortedFiltered.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, sortedFiltered.length]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [activeTab, sortedFiltered.length]);

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

  if (sortedFiltered.length === 0) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-[#0c0f14] p-4 shadow-inner">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#648EFC1A] text-[#9CC2FF]">
          <Ban size={26} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{emptyStateMessage[activeTab]}</p>
          <p className="text-sm text-[--color-text-subtle]">
            Suggestions will appear here once your community starts contributing.
          </p>
        </div>
      </div>
    );
  }

  const visibleSuggestions = sortedFiltered.slice(0, displayCount);
  const hasMore = displayCount < sortedFiltered.length;

  const categoryNameFor = (suggestion: Suggestion) => {
    if (suggestion.categoryId === '__others__') {
      return suggestion.customCategory ? `Others - ${suggestion.customCategory}` : 'Others';
    }
    return categories.find((c) => c.id === suggestion.categoryId)?.name ?? 'Uncategorized';
  };

  const hasAnyActions =
    showActions && (onEdit !== undefined || onApprove !== undefined || onReject !== undefined);

  const actionButtonBase =
    'inline-flex items-center justify-center p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/40';

  return (
    <div className="mt-4 space-y-3">
      {visibleSuggestions.map((suggestion) => {
        const statusStyles =
          suggestion.status === 'approved'
            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
            : suggestion.status === 'rejected'
              ? 'border-red-400/40 bg-red-500/10 text-red-100'
              : 'border-amber-300/40 bg-amber-400/10 text-amber-100';

        return (
          <div
            key={suggestion.id}
            className="relative flex flex-row gap-4 rounded-xl border border-gray-500 p-2 bg-transparent"
          >
            <div className="relative w-24 h-24 sm:w-24 sm:h-24 aspect-square overflow-hidden rounded-md border-2 border-gray-500 bg-black flex items-center justify-center">
              {suggestion.imageUrl ? (
                <img
                  src={suggestion.imageUrl}
                  alt={suggestion.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-base sm:text-base font-semibold text-white truncate">
                      {suggestion.name}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${statusStyles}`}
                    >
                      {suggestion.status === 'approved'
                        ? suggestion.autoApproved
                          ? 'Auto-Approved'
                          : 'Approved'
                        : suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-[--color-text-subtle]">
                    <span className="inline-flex items-center gap-1 text-slate-200">
                      <Grid2X2 size={18} />
                      {categoryNameFor(suggestion)}
                    </span>
                  </div>

                  {suggestion.url && (
                    <div className="mt-1 flex items-center gap-1.5 min-w-0">
                      <ExternalLink size={17} className="flex-shrink-0 text-slate-400" />
                      <a
                        href={suggestion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 transition-colors truncate hover:underline"
                        title={suggestion.url}
                      >
                        {suggestion.url}
                      </a>
                    </div>
                  )}

                  {/* Divider and notes, styled and aligned as requested */}
                  {suggestion.notes && (
                    <>
                      <div className="border-t border-white/15 my-2 w-full" />
                      <div className="space-y-1">
                        <p className="text-[14px] text-slate-200 leading-snug break-words">
                          <span className="font-bold text-white">Note: </span>
                          {suggestion.notes}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {hasAnyActions && (
                  <div className="flex items-center gap-2 self-start">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(suggestion)}
                        className={`${actionButtonBase} hover:text-sky-300`}
                        title="Edit suggestion"
                        aria-label="Edit suggestion"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    {onApprove && (
                      <button
                        onClick={() => onApprove(suggestion.id)}
                        disabled={suggestion.status === 'approved'}
                        className={`${actionButtonBase} hover:text-emerald-300`}
                        title="Approve suggestion"
                        aria-label="Approve suggestion"
                      >
                        <CircleCheck size={18} />
                      </button>
                    )}
                    {onReject && (
                      <button
                        onClick={() => onReject(suggestion.id)}
                        disabled={suggestion.status === 'rejected'}
                        className={`${actionButtonBase} hover:text-red-300`}
                        title="Reject suggestion"
                        aria-label="Reject suggestion"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <button
            onClick={() =>
              setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filtered.length))
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
