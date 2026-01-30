import { useEffect, useState } from 'react';
import type { Listing } from '../../../shared/types/api';
import type { Tier } from '../../hooks/useTiers';
import { ExternalLink, LayoutGrid } from 'lucide-react';
import { navigateTo } from '@devvit/web/client';
import { ReportFormDialog } from '../ReportFormDialog';

const lightenColor = (hex: string, amount = 0.6) => {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex;
  const expanded =
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const num = parseInt(expanded.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
};
interface ListingModalProps {
  listing: Listing | null;
  categoriesById: Record<string, string>;
  sortedTiers: Tier[];
  selectedListingVotes: { total: number; votes: Record<string, number> };
  reportIssue: string;
  reportNotes: string;
  isReporting: boolean;
  userId: string | null;
  onClose: () => void;
  onReportIssueChange: (value: string) => void;
  onReportNotesChange: (value: string) => void;
  onSubmitReport: () => void;
}

export const ListingModal = ({
  listing,
  categoriesById,
  sortedTiers,
  selectedListingVotes,
  reportIssue,
  reportNotes,
  isReporting,
  userId,
  onClose,
  onReportIssueChange,
  onReportNotesChange,
  onSubmitReport,
}: ListingModalProps) => {
  if (!listing) return null;

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isPortrait, setIsPortrait] = useState<boolean | null>(null);

  useEffect(() => {
    setIsPortrait(null);
  }, [listing?.id]);

  const totalVotes = selectedListingVotes.total || 0;

  const tierVoteStats = sortedTiers.map((tier) => {
    const tierVotes = selectedListingVotes.votes?.[tier.name] || 0;
    const percent = totalVotes > 0 ? Math.round((tierVotes / totalVotes) * 100) : 0;
    return { tier, tierVotes, percent };
  });

  const topTier = tierVoteStats.reduce<{ tier: Tier; tierVotes: number; percent: number } | null>(
    (best, current) => {
      if (!best || current.tierVotes > best.tierVotes) return current;
      return best;
    },
    null
  );

  const borderColor = topTier?.tier.colour || '#ffffff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-2 py-2">
      <div className="relative w-full max-w-[86vw] sm:max-w-[280px] md:max-w-[320px]">
        {/* Close Button - Outside the card */}
        {/* Close Button - Overlapping the corner */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 rounded-full h-8 w-8 flex items-center justify-center bg-[#1A1A1B] border border-[#343536] text-gray-400 hover:text-white hover:bg-[#272729] hover:cursor-pointer transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-white shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="listing-modal-scroll flex flex-col w-full max-h-[85vh] border border-[#343536] overflow-y-auto rounded-lg bg-black shadow-xl py-4 px-4 text-white">
          <div className="flex flex-col items-center gap-2 w-full mb-2">
            <div
              className={`relative inline-flex w-full rounded-lg border-2 overflow-hidden 
                ${isPortrait ? 'aspect-square' : ''} 
              `}
              style={{ borderColor: borderColor }}
            >
              <div
                className={`flex items-center justify-center w-full h-full ${
                  isPortrait ? 'px-4' : ''
                }`}
              >
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.name}
                    className="h-full w-full max-h-full max-w-full object-contain"
                    onLoad={(event) => {
                      const { naturalHeight, naturalWidth } = event.currentTarget;
                      setIsPortrait(naturalHeight > naturalWidth);
                    }}
                  />
                ) : (
                  <div className="h-40 w-40 sm:h-48 sm:w-48 flex items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col border-b border-[#343536] pb-2">
              {listing.name ? (
                <>
                  <div className="flex items-center justify-between w-full">
                    <p className="text-base font-bold text-white leading-tight">{listing.name}</p>
                    {listing.url && (
                      <button
                        className="text-gray-400 hover:text-white cursor-pointer transition-colors flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo(listing.url || '');
                        }}
                        title="Open external link"
                      >
                        <ExternalLink size={18} />
                      </button>
                    )}
                  </div>

                  {(() => {
                    const categoryDisplay =
                      (listing.category === '__others__' || listing.category === 'Others'
                        ? ''
                        : listing.category) ||
                      (listing.categoryId === '__others__' ||
                      categoriesById[listing.categoryId] === 'Others'
                        ? ''
                        : categoriesById[listing.categoryId]) ||
                      '';
                    return categoryDisplay ? (
                      <span className="text-xs flex items-center sm:text-sm text-gray-600">
                        <LayoutGrid size={14} className="inline-block mr-1" />
                        {categoryDisplay}
                      </span>
                    ) : null;
                  })()}
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  {(() => {
                    const categoryDisplay =
                      (listing.category === '__others__' || listing.category === 'Others'
                        ? ''
                        : listing.category) ||
                      (listing.categoryId === '__others__' ||
                      categoriesById[listing.categoryId] === 'Others'
                        ? ''
                        : categoriesById[listing.categoryId]) ||
                      '';
                    return categoryDisplay ? (
                      <span className="text-xs flex items-center sm:text-sm text-gray-600">
                        <LayoutGrid size={14} className="inline-block mr-1" />
                        {categoryDisplay}
                      </span>
                    ) : (
                      <div />
                    );
                  })()}
                  {listing.url && (
                    <button
                      className="text-gray-400 hover:text-white cursor-pointer transition-colors flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo(listing.url || '');
                      }}
                      title="Open external link"
                    >
                      <ExternalLink size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="w-full font-bold text-sm text-slate-200 text-center">
              {totalVotes} Total Votes
            </div>
          </div>

          <div className="space-y-1 mb-2 w-full">
            {tierVoteStats.map(({ tier, tierVotes, percent }) => (
              <div
                key={tier.id}
                className="rounded-md border border-[#343536] overflow-hidden w-full"
                style={{ backgroundColor: lightenColor(tier.colour, 0.6) }}
              >
                <div className="relative w-full">
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${percent}%`, backgroundColor: tier.colour }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2 text-black w-full">
                    <span className="text-sm font-semibold truncate mr-2">{tier.name}</span>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {percent}% ({tierVotes})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center w-full">
            <button
              type="button"
              onClick={() => setReportDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#2A3236] transition-colors hover:cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16h.01" />
                <path d="M12 8v4" />
                <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" />
              </svg>
              Report Item
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .listing-modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .listing-modal-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <ReportFormDialog
        isOpen={reportDialogOpen}
        reportIssue={reportIssue}
        reportNotes={reportNotes}
        isReporting={isReporting}
        userId={userId}
        onClose={() => setReportDialogOpen(false)}
        onReportIssueChange={onReportIssueChange}
        onReportNotesChange={onReportNotesChange}
        onSubmitReport={onSubmitReport}
      />
    </div>
  );
};
