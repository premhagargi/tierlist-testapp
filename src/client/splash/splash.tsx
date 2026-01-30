import '../style.css';

import { requestExpandedMode } from '@devvit/web/client';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Users, ChevronUpCircle, ChevronRight } from 'lucide-react';
import { TierMajoritySection } from '../components/Home/TierMajoritySection';
import { useTiers } from '../hooks/useTiers';
import { useListings } from '../hooks/useListings';
import type { Listing } from '../../shared/types/api';

const getAppId = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/init');
    const data = await res.json();

    if (!res.ok || !data?.postId) {
      console.error('[Splash] getAppId - Failed to resolve postId from backend context:', data);
      return null;
    }

    return data.postId as string;
  } catch (error) {
    console.error('[Splash] Failed to get appId from backend context:', error);
    return null;
  }
};

const isVotingExpired = (expiryDate: Date | null): boolean => {
  if (!expiryDate) return false;
  return new Date() > new Date(expiryDate);
};

// --- Background Component ---

interface SplashBackgroundProps {
  appId: string;
  onStatsUpdate: (contributors: number) => void;
  onReady: () => void;
}

const SplashBackground = ({ appId, onStatsUpdate, onReady }: SplashBackgroundProps) => {
  const { tiers, loading: tiersLoading } = useTiers(appId);
  const { listings, loading: listingsLoading } = useListings(appId);

  const hasNotifiedReady = useRef(false);
  const notifyReady = useCallback(() => {
    if (hasNotifiedReady.current) return;
    hasNotifiedReady.current = true;
    onReady();
  }, [onReady]);

  const sortedTiers = useMemo(() => [...tiers].sort((a, b) => a.order - b.order), [tiers]);

  const { listingsByDominantTier, totalVotesGlobal } = useMemo(() => {
    const byTier: Record<
      string,
      Array<{ listing: Listing; totalVotes: number; topVotes: number; percent: number }>
    > = {};
    const validTierIndices: Record<string, number> = {};

    // Initialize buckets
    sortedTiers.forEach((tier, index) => {
      byTier[tier.name] = [];
      validTierIndices[tier.name] = index;
    });

    // Track unique contributors
    const uniqueContributors = new Set<string>();

    listings.forEach((listing) => {
      const votes = listing.votes || {};

      let validTotal = 0;
      const validVoteEntries: Array<{ tierName: string; count: number }> = [];

      Object.entries(votes).forEach(([tierName, count]) => {
        if (validTierIndices[tierName] !== undefined) {
          const numericCount = typeof count === 'number' ? count : 0;
          validTotal += numericCount;
          validVoteEntries.push({ tierName, count: numericCount });
        }
      });

      if (validTotal === 0) return;

      // Track contributors
      if (listing.userVotes && typeof listing.userVotes === 'object') {
        Object.keys(listing.userVotes).forEach((userId) => uniqueContributors.add(userId));
      }

      if (validVoteEntries.length === 0) return;

      const bestEntry = validVoteEntries.reduce((best, current) => {
        if (!best) return current;
        if (current.count > best.count) return current;
        if (current.count < best.count) return best;

        const bestIdx = validTierIndices[best.tierName] ?? Number.MAX_SAFE_INTEGER;
        const currIdx = validTierIndices[current.tierName] ?? Number.MAX_SAFE_INTEGER;
        return currIdx < bestIdx ? current : best;
      }, validVoteEntries[0]);

      const bucket = bestEntry ? byTier[bestEntry.tierName] : undefined;
      if (bestEntry && bucket) {
        const percent = Math.round((bestEntry.count / validTotal) * 100);
        bucket.push({
          listing,
          totalVotes: validTotal,
          topVotes: bestEntry.count,
          percent,
        });
      }
    });

    const contributorsCount = uniqueContributors.size > 0 ? uniqueContributors.size + 1 : 0;

    return { listingsByDominantTier: byTier, totalVotesGlobal: contributorsCount };
  }, [listings, sortedTiers]);

  useEffect(() => {
    if (!tiersLoading && !listingsLoading) {
      onStatsUpdate(totalVotesGlobal);
    }
  }, [totalVotesGlobal, tiersLoading, listingsLoading, onStatsUpdate]);

  useEffect(() => {
    if (tiersLoading || listingsLoading) return;
    const hasImages = listings.some((listing) => Boolean(listing.imageUrl));
    if (!hasImages) {
      notifyReady();
    }
  }, [tiersLoading, listingsLoading, listings, notifyReady]);

  if (tiersLoading || listingsLoading) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <TierMajoritySection
        tiers={sortedTiers}
        listingsByDominantTier={listingsByDominantTier}
        isLoading={false}
        onSelectListing={() => {}}
        className="!rounded-none !border-0 w-full"
        onImageLoad={notifyReady}
      />
    </div>
  );
};

// --- Main Splash Component ---

const SplashLoader = () => <span className="loader" aria-label="Loading" />;

export const Splash = () => {
  const [callToAction, setCallToAction] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Dynamic branding
  const [appIconUri, setAppIconUri] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#0E1113');

  // Stats from background
  const [contributorCount, setContributorCount] = useState<number | null>(null);
  const [loadBackground, setLoadBackground] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);

  useEffect(() => {
    let bgTimer: number | undefined;

    const init = async () => {
      const id = await getAppId();
      if (!id) {
        setLoadingSettings(false);
        return;
      }
      setAppId(id);

      try {
        const res = await fetch(`/api/misc/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            if (data.data.callToAction) setCallToAction(data.data.callToAction);
            if (data.data.shortDescription) setShortDescription(data.data.shortDescription);
            if (data.data.expiryDate) setExpiryDate(new Date(data.data.expiryDate));
            if (data.data.appIconUri) setAppIconUri(data.data.appIconUri);
            if (data.data.backgroundColor) setBackgroundColor(data.data.backgroundColor);
          }
        }
      } catch (error) {
        console.error('[Splash] Failed to fetch settings:', error);
      } finally {
        setLoadingSettings(false);
        // Defer heavy background (TierMajoritySection) so pills/buttons show immediately
        bgTimer = window.setTimeout(() => setLoadBackground(true), 200);
      }
    };

    init();

    return () => {
      if (bgTimer) window.clearTimeout(bgTimer);
    };
  }, []);

  const expired = isVotingExpired(expiryDate);
  const mainTitle = expired ? shortDescription || '' : callToAction || '';

  const formattedContributors =
    contributorCount !== null
      ? contributorCount > 999
        ? (contributorCount / 1000).toFixed(1) + 'k'
        : Math.max(contributorCount, 2).toString()
      : '...';

  const contributorLabel =
    contributorCount === null ? '1 Contributors' : `${formattedContributors} Contributors`;
  const statusLabel = loadingSettings ? 'Loading' : expired ? 'Voting Closed' : 'Live';

  if (!appId && !loadingSettings) {
    return (
      <div className="min-h-screen bg-[#0E1113] flex flex-col items-center justify-center text-white p-8 text-center relative z-50">
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center justify-center gap-2">
            ⚠️ No Post Context
          </h2>
          <p className="text-gray-300 mb-4">
            The app could not resolve a <b>Post ID</b> from the backend context.
          </p>
          <p className="text-gray-400 text-sm">
            Make sure you are running this app inside a Reddit post using the Devvit runtime.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden relative font-sans text-white selection:bg-white/20 cursor-pointer transition-colors duration-500"
      style={{ backgroundColor: backgroundColor || '#0E1113' }}
      onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
    >
      {/* Background Layer */}
      {appId && loadBackground && (
        <SplashBackground
          appId={appId}
          onStatsUpdate={setContributorCount}
          onReady={() => setBackgroundReady(true)}
        />
      )}

      {/* Heavy Vignette / Overlay for Readability */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/15 via-black/70 to-black/100"></div>
      <div
        className="absolute inset-0 pointer-events-none
  bg-gradient-to-b
  from-black/80 from-0%
  to-transparent to-20%
"
      ></div>

      {/* Top Bar - Header */}
      {appId && contributorCount !== null && !loadingSettings && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border-[1px] md:border-[1.5px] border-gray-500 px-5 py-1 rounded-full shadow-sm">
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="text-sm font-semibold text-white tracking-wide inline-flex items-center justify-center">
              {contributorLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border-[1px] md:border-[1.5px] border-gray-500 px-5 py-1 rounded-full shadow-sm">
            {expired ? (
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            )}
            <span className="text-sm font-semibold text-white tracking-wide inline-flex items-center justify-center">
              {statusLabel}
            </span>
          </div>
        </div>
      )}

      {(loadingSettings || (appId && !backgroundReady)) && (
        <div
          className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none"
          style={{ top: '33%' }}
        >
          <SplashLoader />
        </div>
      )}

      {/* Icon Display */}
      {appIconUri && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <img
            src={appIconUri}
            alt="App Icon"
            className="w-16 h-16 rounded-full object-cover border-2 border-white/80 shadow-lg"
          />
        </div>
      )}

      {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center justify-end pb-12 pt-24 px-6 text-center">
          <h1 className="text-2xl font-semibold text-white mb-6 drop-shadow-lg max-w-lg mx-auto leading-tight">
            {mainTitle}
          </h1>

          <div className="flex flex-col items-center gap-5 w-full max-w-xs">
            <button
              className="hover:cursor-pointer flex items-center gap-2 pl-1 pr-5 py-1 font-bold text-lg tracking-wide rounded-full bg-white text-black transition-all duration-200 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] group uppercase"
              onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
            >
              <ChevronUpCircle className="w-10 h-10 stroke-white fill-black" />
              {expired ? 'View Tier List' : 'START RANKING'}
            </button>

            <div style={{ minHeight: '32px' }} className="flex items-center">
              {loadingSettings ? (
                <span className="text-base font-semibold text-transparent select-none">
                  View Tier List
                </span>
              ) : expired ? (
                <span className="text-base font-semibold text-transparent select-none">
                  View Tier List
                </span>
              ) : (
                <button
                  className="text-base font-semibold flex items-center gap-1 cursor-pointer text-white transition-all"
                  onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
                >
                  View Tier List
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<Splash />);
