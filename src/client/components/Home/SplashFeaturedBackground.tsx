import { TierButtons } from "../Voting/TierButtons";
import type { Listing } from '../../../shared/types/api';
import { Tier } from "../Voting/types";
import { SelectedListing } from "../Voting/SelectedListing";

interface SplashFeaturedBackgroundProps {
  listing: Listing;
  tiers: Tier[];
}

export const SplashFeaturedBackground = ({
  listing,
  tiers,
}: SplashFeaturedBackgroundProps) => {
  const totalVotes = listing.totalVotes ?? 0;

  // Transform shared Listing to Voting Listing (ensure required properties are never undefined)
  const votingListing = {
    id: listing.id,
    name: listing.name || '',
    imageUrl: listing.imageUrl || '',
    category: listing.category || 'Uncategorized',
    totalVotes: listing.totalVotes ?? 0,
    votes: listing.votes || {},
    userVotes: listing.userVotes || {},
    createdAt: listing.createdAt || new Date().toISOString(),
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-4 md:gap-4 px-4 pt-6">
        <div className="w-full sm:basis-1/2 pt-3">
          <SelectedListing
            listing={votingListing}
            categoryName={listing.category ?? 'Uncategorized'}
            isVotingLive={false} // 🔒 disable voting
          />
        </div>

        <div className="w-full sm:basis-1/2 sm:pt-2 pt-0 sm:px-0 px-1 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="space-y-0.5">
              <p className="text-base font-semibold">Community Ranking</p>
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {totalVotes} Votes
            </span>
          </div>

          <TierButtons
            tiers={tiers}
            selectedListing={votingListing}
            totalVotes={totalVotes}
            showResults={true}
            isVoting={false}
            votingTier={null}
            userVote={null}
            lastVotedTier={null}
            onVote={() => {}} // 🔒 noop
            isExpired={false} // 🔒 show colors, just disable voting
          />
        </div>
      </div>
    </div>
  );
};
