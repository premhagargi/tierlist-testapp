import { useEffect, useState } from 'react';
import type { Listing } from './types';
import { ExternalLink, LayoutGrid } from 'lucide-react';
import { navigateTo } from '@devvit/web/client';

interface SelectedListingProps {
  listing: Listing;
  categoryName?: string;
  isVotingLive?: boolean;
}

export const SelectedListing = ({ listing, categoryName, isVotingLive }: SelectedListingProps) => {
  const [isPortrait, setIsPortrait] = useState<boolean | null>(null);

  // Determine category display
  // If categoryName is provided and not "Others", use it
  // Otherwise check listing.category (could be "Others - Custom")
  // If category doesn't exist (starts with cat-), show "Others"
  const categoryDisplay = (() => {
    if (categoryName && categoryName !== '__others__' && categoryName !== 'Others') {
      return categoryName;
    }
    if (listing.categoryId === '__others__') {
      return listing.category && listing.category !== 'Others' ? listing.category : '';
    }
    // If categoryId looks like a deleted category (cat-xxxxx) and no valid categoryName, show "Others"
    if (listing.categoryId?.startsWith('cat-') && !categoryName) {
      return 'Others';
    }
    if (listing.category && listing.category !== 'Others') {
      return listing.category;
    }
    return '';
  })();

  useEffect(() => {
    setIsPortrait(null);
  }, [listing.imageUrl]);

  const paddingClass = isPortrait === null ? '' : isPortrait ? 'px-4' : 'py-4';

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-0 relative">
      <div
        className={`relative w-full aspect-square rounded-md overflow-hidden border-2 border-gray-500 flex items-center justify-center bg-black ${paddingClass}`}
      >
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.name}
            className="h-full w-full object-contain"
            onLoad={(event) => {
              const { naturalHeight, naturalWidth } = event.currentTarget;
              setIsPortrait(naturalHeight > naturalWidth);
            }}
          />
        ) : (
          <div className="text-xs uppercase tracking-[0.08em] text-slate-400">No image</div>
        )}
      </div>

      <div className="w-full flex flex-col sm:pb-2 pb-0">
        {listing.name ? (
          <>
            <div className="flex items-center justify-between w-full gap-2">
              <p className="sm:text-base font-bold text-white leading-tight">{listing.name}</p>
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

            {categoryDisplay && (
              <span className="text-sm flex items-center text-gray-600 mt-1">
                <LayoutGrid size={14} className="inline-block mr-1" />
                {categoryDisplay}
              </span>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            {categoryDisplay ? (
              <span className="text-sm flex items-center text-gray-600">
                <LayoutGrid size={14} className="inline-block mr-1" />
                {categoryDisplay}
              </span>
            ) : (
              <div />
            )}
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
    </div>
  );
};
