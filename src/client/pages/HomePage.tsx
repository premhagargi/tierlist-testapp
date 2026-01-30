import { useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '@devvit/web/client';
import { PageLoader } from '../components/PageLoader';
import type { Listing } from '../../shared/types/api';
import { useTiers } from '../hooks/useTiers';
import { useListings } from '../hooks/useListings';
import { useCategories } from '../hooks/useCategories';
import { TierMajoritySection } from '../components/Home/TierMajoritySection';
import { ListingModal } from '../components/Home/ListingModal';

interface HomePageProps {
  displayName: string | null;
  avatarUrl: string | null;
  appId: string;
  userId: string | null;
  onStartVoting: () => void;
  onViewTierList: () => void;
}

export const HomePage = ({
  displayName,
  avatarUrl,
  appId,
  userId,
  onStartVoting: _onStartVoting,
  onViewTierList: _onViewTierList,
}: HomePageProps) => {
  const { tiers, loading: tiersLoading } = useTiers(appId);
  const { listings, loading: listingsLoading } = useListings(appId);
  const { categories, loading: categoriesLoading } = useCategories(appId);

  const [activeTab, setActiveTab] = useState<'community' | 'mine'>('community');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  const sortedTiers = useMemo(() => [...tiers].sort((a, b) => a.order - b.order), [tiers]);

  const categoriesById = useMemo(() => {
    const base = {
      ...Object.fromEntries(categories.map((cat) => [cat.id, cat.name])),
      '__others__': 'Others',
    } as Record<string, string>;

    listings.forEach((listing) => {
      if (listing.category && listing.category.startsWith('Others - ')) {
        base[listing.category] = listing.category;
      }
    });
    return base;
  }, [categories, listings]);

  const filteredListings = useMemo(() => {
    if (selectedCategoryId === 'all') return listings;
    return listings.filter((listing) => {
      if (listing.categoryId === selectedCategoryId) return true;
      if (listing.category === selectedCategoryId) return true;
      return false;
    });
  }, [listings, selectedCategoryId]);

  const listingsByDominantTier = useMemo(() => {
    const byTier: Record<
      string,
      Array<{ listing: Listing; totalVotes: number; topVotes: number; percent: number }>
    > = {};
    const validTierIndices: Record<string, number> = {};

    // 1. Initialize buckets and capture tie order
    sortedTiers.forEach((tier, index) => {
      byTier[tier.name] = [];
      validTierIndices[tier.name] = index;
    });

    filteredListings.forEach((listing) => {
      const votes = listing.votes || {};

      // 2. Filter & Recalculate Totals (Valid Tiers Only)
      let validTotal = 0;
      const validVoteEntries: Array<{ tierName: string; count: number }> = [];

      Object.entries(votes).forEach(([tName, count]) => {
        if (validTierIndices[tName] !== undefined) {
          validTotal += count;
          validVoteEntries.push({ tierName: tName, count });
        }
      });

      if (validTotal === 0) return;

      // 3. Find Winner (Max Agreement + Tie Break)
      if (validVoteEntries.length === 0) return;
      const bestEntry = validVoteEntries.reduce((best, current) => {
        if (!best) return current;
        if (!current) return best;
        if (current.count > best.count) return current;
        if (current.count < best.count) return best;

        // Tie: check tier order
        const bestIdx = validTierIndices[best.tierName] ?? 999;
        const currIdx = validTierIndices[current.tierName] ?? 999;
        return currIdx < bestIdx ? current : best;
      }, validVoteEntries[0]);

      // 4. Push to bucket
      if (bestEntry) {
        const tierList = byTier[bestEntry.tierName];
        if (tierList) {
          const percent = Math.round((bestEntry.count / validTotal) * 100);
          tierList.push({
            listing,
            totalVotes: validTotal,
            topVotes: bestEntry.count,
            percent,
          });
        }
      }
    });

    return byTier;
  }, [filteredListings, sortedTiers]);

  const userListingsByTier = useMemo(() => {
    const byTier: Record<
      string,
      Array<{ listing: Listing; totalVotes: number; topVotes: number; percent: number }>
    > = {};
    const validTierIndices: Record<string, number> = {};

    sortedTiers.forEach((tier, index) => {
      byTier[tier.name] = [];
      validTierIndices[tier.name] = index;
    });

    if (!userId) return byTier;

    filteredListings.forEach((listing) => {
      const userTier = listing.userVotes?.[userId];
      // Only include if user's voted tier is still valid
      if (!userTier || validTierIndices[userTier] === undefined) return;

      const votes = listing.votes || {};

      // Filter & Recalculate Totals (Valid Tiers Only)
      let validTotal = 0;
      Object.entries(votes).forEach(([tName, count]) => {
        if (validTierIndices[tName] !== undefined) {
          validTotal += count;
        }
      });

      const topVotes = votes[userTier] || 0;
      const percent = validTotal ? Math.round((topVotes / validTotal) * 100) : 0;
      const tierList = byTier[userTier];
      if (tierList) {
        tierList.push({ listing, totalVotes: validTotal, topVotes, percent });
      }
    });

    return byTier;
  }, [filteredListings, sortedTiers, userId]);

  const isLoading = tiersLoading || listingsLoading || categoriesLoading;

  const selectedListingVotes = useMemo(() => {
    if (!selectedListing) return { total: 0, votes: {} as Record<string, number> };
    const votes = selectedListing.votes || {};
    const total =
      selectedListing.totalVotes !== undefined
        ? selectedListing.totalVotes
        : Object.values(votes).reduce((sum, val) => sum + val, 0);
    return { total, votes };
  }, [selectedListing]);

  const closeModal = () => {
    setSelectedListing(null);
    setReportIssue('');
    setReportNotes('');
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!categoryMenuRef.current) return;
      if (!categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleReportSubmit = async () => {
    if (!selectedListing) return;
    if (!userId) {
      showToast('Please log in to report an item.');
      return;
    }
    if (!reportIssue.trim()) {
      showToast('Select an issue');
      return;
    }

    try {
      setIsReporting(true);

      const response = await fetch(`/api/reports/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing.id,
          listingName: selectedListing.name,
          listingImageUrl: selectedListing.imageUrl,
          category: categoriesById[selectedListing.categoryId] || 'Uncategorized',
          issue: reportIssue,
          comment: reportNotes.trim() || undefined,
          reporterId: userId,
          reporterName: displayName || avatarUrl || 'Anonymous',
        }),
      });

      const data = await response.json();

      if (data.status !== 'success') {
        showToast(data.message || 'Failed to submit report');
        return;
      }

      showToast({ text: 'Report Submitted', appearance: 'success' });
      setReportIssue('');
      setReportNotes('');
      closeModal();
    } catch (error) {
      console.error('Error reporting listing:', error);
      showToast('Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <div className="min-h-[calc(100vh-56px)] bg-[#0E1113] text-white">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2 space-y-6">
          <div className=" overflow-hidden">
            <div className="flex flex-col gap-3 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('community')}
                    className={`py-1 text-sm cursor-pointer font-semibold border-b-2 transition-colors ${
                      activeTab === 'community'
                        ? 'border-[var(--color-accent-blue)] text-[--color-text]'
                        : 'border-transparent text-[--color-text-subtle] hover:text-[--color-text]'
                    }`}
                  >
                    Community Ranking
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mine')}
                    className={`py-1 text-sm cursor-pointer font-semibold border-b-2 transition-colors ${
                      activeTab === 'mine'
                        ? 'border-[var(--color-accent-blue)] text-[--color-text]'
                        : 'border-transparent text-[--color-text-subtle] hover:text-[--color-text]'
                    }`}
                  >
                    My Ranking
                  </button>
                </div>

                <div className="relative" ref={categoryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setCategoryMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-white cursor-pointer"
                  >
                    <span className=" text-white">
                      {selectedCategoryId === 'all'
                        ? 'Categories'
                        : categoriesById[selectedCategoryId] || 'Unknown'}
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {categoryMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 max-h-60 overflow-y-auto rounded-lg border border-white/15 bg-[#0E1113] shadow-xl z-20 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId('all');
                          setCategoryMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                          selectedCategoryId === 'all' ? 'text-white' : 'text-white'
                        }`}
                      >
                        All categories
                      </button>
                      {[...categories]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setCategoryMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                              selectedCategoryId === category.id ? 'text-white' : 'text-white'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId('__others__');
                          setCategoryMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                          selectedCategoryId === '__others__' ? 'text-white' : 'text-white'
                        }`}
                      >
                        Others
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <TierMajoritySection
              tiers={sortedTiers}
              listingsByDominantTier={
                activeTab === 'mine' ? userListingsByTier : listingsByDominantTier
              }
              isLoading={false}
              onSelectListing={(listing) => setSelectedListing(listing)}
            />
          </div>
        </div>
      </div>

      <ListingModal
        listing={selectedListing}
        categoriesById={categoriesById}
        sortedTiers={sortedTiers}
        selectedListingVotes={selectedListingVotes}
        reportIssue={reportIssue}
        reportNotes={reportNotes}
        isReporting={isReporting}
        userId={userId}
        onClose={closeModal}
        onReportIssueChange={setReportIssue}
        onReportNotesChange={setReportNotes}
        onSubmitReport={handleReportSubmit}
      />
    </>
  );
};
