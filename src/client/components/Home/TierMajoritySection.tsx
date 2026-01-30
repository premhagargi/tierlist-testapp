import type { Listing } from '../../../shared/types/api';
import type { Tier } from '../../hooks/useTiers';

interface TierMajoritySectionProps {
  tiers: Tier[];
  listingsByDominantTier: Record<
    string,
    Array<{ listing: Listing; totalVotes: number; topVotes: number; percent: number }>
  >;
  isLoading: boolean;
  onSelectListing: (listing: Listing) => void;
  className?: string; // Allow custom classes
  onImageLoad?: () => void;
}

export const TierMajoritySection = ({
  tiers,
  listingsByDominantTier,
  isLoading,
  onSelectListing,
  className = '',
  onImageLoad,
}: TierMajoritySectionProps) => (
  <div className={`flex flex-col gap-1 text-white ${className}`}>
    {isLoading && (
      <div className="px-4 py-3 text-xs text-[--color-text-subtle] border border-[#3E4142]">
        Loading tiers and listings…
      </div>
    )}

    {tiers.map((tier) => {
      const items = (listingsByDominantTier[tier.name] || []).sort((a, b) => b.percent - a.percent);

      return (
        <div
          key={tier.id}
          className="relative flex gap-1 rounded-sm overflow-hidden"
          style={{ backgroundColor: 'black' }}
        >
          <div className="relative w-16 sm:w-20 flex rounded-sm border border-[#3E4142] flex-col items-center justify-center px-2 py-3 overflow-hidden shrink-0">
            <div
              className="absolute inset-0"
              style={{ backgroundColor: tier.colour || '#ffffff' }}
            />
            <div className="relative z-10 flex flex-col items-center gap-2 w-full">
              <span
                className={`text-sm font-semibold text-black text-center break-words w-full px-0.5 ${
                  items.length > 4 ? 'line-clamp-6' : 'line-clamp-3'
                } ${items.length > 8 ? 'sm:line-clamp-6' : 'sm:line-clamp-3'}`}
              >
                {tier.name}
              </span>
            </div>
          </div>

          <div className="flex-1 bg-[#181c1f] rounded-sm border border-[#3E4142] min-h-[80px]">
            {items.length === 0 ? (
              <div className="text-sm text-slate-200 h-full"></div>
            ) : (
              <div className="flex flex-wrap">
                {items.map(({ listing }) => (
                  <button
                    key={listing.id}
                    onClick={() => onSelectListing(listing)}
                    className="listing-item relative h-20 min-w-[58px] max-w-[100px] overflow-hidden border border-white/10 bg-[#0c0c0c] shadow transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
                    aria-label={listing.name}
                  >
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.name}
                        className="h-full w-auto object-contain mx-auto"
                        loading="lazy"
                        onLoad={onImageLoad}
                        onError={onImageLoad}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-[--color-text-subtle]">
                        No image
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    })}

    {tiers.length === 0 && (
      <div className="px-4 py-6 text-center text-sm text-[--color-text-subtle] border rounded-md border-[#3E4142]">
        No tiers available yet.
      </div>
    )}
  </div>
);
