import { useEffect, useMemo, useState } from 'react';
import { showToast } from '@devvit/web/client';
import { SelectedListing } from '../components/Voting/SelectedListing';
import { SkipReport } from '../components/Voting/SkipReport';
import { TierButtons } from '../components/Voting/TierButtons';
import { VotingGallery } from '../components/Voting/VotingGallery';
import type { Listing, Tier } from '../components/Voting/types';
import { useCategories } from '../hooks/useCategories';
import { PageLoader } from '../components/PageLoader';
import { ReportFormDialog } from '../components/ReportFormDialog';
import { CompletionModal } from '../components/Voting/CompletionModal';
import { SuggestionFormDialog } from '../components/modqueue/Suggestions/SuggestionFormDialog';
import { useSuggestions } from '../hooks/useSuggestions';

interface VotingPageProps {
  displayName: string | null;
  avatarUrl: string | null;
  userId: string | null;
  appId: string;
  onAutoSkipChange?: (isAutoSkipping: boolean) => void;
}

export const VotingPage = ({ displayName, userId, appId, onAutoSkipChange }: VotingPageProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [votingTier, setVotingTier] = useState<string | null>(null);
  const [lastVotedTier, setLastVotedTier] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortLatestFirst, setSortLatestFirst] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);

  // Completion & Suggestion States
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);
  const [isAutoSkipping, setIsAutoSkipping] = useState(false);

  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories(appId);
  const { createSuggestion } = useSuggestions(appId);

  const categoriesById = useMemo(
    () =>
      ({
        ...Object.fromEntries(categories.map((cat) => [cat.id ?? cat.name, cat.name])),
        '__others__': 'Others',
      }) as Record<string, string>,
    [categories]
  );

  const totalVotes = useMemo(() => {
    if (!selectedListing) return 0;
    if (selectedListing.totalVotes !== undefined) return selectedListing.totalVotes;
    const votes = selectedListing.votes || {};
    return Object.values(votes).reduce((sum, count) => sum + (count || 0), 0);
  }, [selectedListing]);

  const userVote = useMemo(() => {
    if (!selectedListing || !userId) return null;
    return selectedListing.userVotes?.[userId] || null;
  }, [selectedListing, userId]);

  const showResults = Boolean(userVote);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/listings/${appId}`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const json = (await res.json()) as { data?: Listing[] };
      const data = json.data || [];
      setListings(data);
      // Logic for initial selection: prioritize unvoted, popular items? 
      // User request: Don't change order. Pick first or current.
      setSelectedListing((current) => {
        if (current && data.some((item) => item.id === current.id)) return current;
        return data[0] || null;
      });
    } catch (error) {
      console.error('Error fetching listings', error);
      setListings([]);
      setSelectedListing(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await fetch(`/api/tiers/${appId}`);
      if (!res.ok) throw new Error('Failed to fetch tiers');
      const json = (await res.json()) as { data?: Tier[] };
      setTiers(json.data || []);
    } catch (error) {
      console.error('Error fetching tiers', error);
      setTiers([]);
    }
  };

  const refreshSelectedListing = async (listingId: string) => {
    try {
      const res = await fetch(`/api/listings/${appId}/${listingId}`);
      if (res.ok) {
        const json = (await res.json()) as { listing?: Listing };
        const updatedListing = json.listing;
        if (!updatedListing) throw new Error('Missing listing');
        
        // Update both the selected item and the list
        setSelectedListing(updatedListing);
        setListings((prev) => prev.map((item) => (item.id === listingId ? updatedListing : item)));
        return;
      }
    } catch (error) {
      console.error('Error refreshing listing', error);
    }
    await fetchListings();
  };

  useEffect(() => {
    fetchListings();
  }, [appId]);

  useEffect(() => {
    fetchTiers();
  }, [appId]);

  useEffect(() => {
    setLastVotedTier(userVote);
  }, [userVote]);

  // Notify parent when auto-skip state changes
  useEffect(() => {
    console.log('[AutoSkip] State changed, notifying parent:', isAutoSkipping);
    onAutoSkipChange?.(isAutoSkipping);
  }, [isAutoSkipping, onAutoSkipChange]);

  useEffect(() => {
    // Reset filters when app changes to avoid stale values
    setCategoryFilter('all');
    setSearchTerm('');
    setSortLatestFirst(false);
    setShowReportForm(false);
    setReportReason('');
    setReportNotes('');
    setShowCompletionModal(false);
  }, [appId]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/misc/${appId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data?.expiryDate) {
            setExpiryDate(new Date(data.data.expiryDate));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, [appId]);

  const isExpired = useMemo(() => {
    if (!expiryDate) return false;
    return new Date() > expiryDate;
  }, [expiryDate]);

  const filteredListings = useMemo(() => {
    const normalize = (value?: string) => (value ? value.toLowerCase().trim() : '');
    const term = normalize(searchTerm);
    const normalizedCategory = normalize(categoryFilter);

    const items = listings
      .filter((item) => {
        const matchesSearch = !term || normalize(item.name).includes(term);
        const itemCategoryId = normalize(item.categoryId);
        const itemCategoryName = normalize(item.category);
        const matchesCategory =
          normalizedCategory === 'all' ||
          itemCategoryId === normalizedCategory ||
          itemCategoryName === normalizedCategory;
        return matchesSearch && matchesCategory;
      })
      .slice();

    if (sortLatestFirst) {
      const toTimestamp = (value?: string | number) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = Date.parse(value);
          return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      items.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
    }

    return items;
  }, [listings, searchTerm, categoryFilter, sortLatestFirst]);

  // Popular sort: votes desc, then newest first
  const sortedByVotesListings = useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      const votesA =
        a.totalVotes ?? (a.votes ? Object.values(a.votes).reduce((sum, v) => sum + v, 0) : 0);
      const votesB =
        b.totalVotes ?? (b.votes ? Object.values(b.votes).reduce((sum, v) => sum + v, 0) : 0);

      if (votesA !== votesB) return votesB - votesA;

      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredListings]);

  const otherCategories = useMemo(() => {
    return Array.from(new Set(
      listings
        .filter((l: Listing) => l.category && l.category.startsWith('Others - '))
        .map((l: Listing) => l.category as string)
    )).sort();
  }, [listings]);

  const selectedListingCategoryName = useMemo(() => {
    if (!selectedListing) return undefined;
    const idKey = selectedListing.categoryId;
    const nameKey = selectedListing.category;

    if (nameKey) return nameKey;
    if (idKey === '__others__') return 'Others';
    if (idKey && categoriesById[idKey]) return categoriesById[idKey];

    return idKey === '__others__' ? 'Others' : (idKey ?? undefined);
  }, [selectedListing, categoriesById]);

  useEffect(() => {
    if (!listings.length) {
      setSelectedListing(null);
      return;
    }

    if (!selectedListing) {
      // On initial load, try to find first unvoted item (popular) ?
      // User said "dont change the order of the item whenever it gets voted... keep the listings as it is"
      // So we should respect the current sort (filteredListings vs sortedByVotesListings).
      // The user sees `VotingGallery` which uses `filteredListings`.
      // The "Skip" logic uses `sortedByVotesListings`. 
      // If the user wants "Keep the order same as it is", they might mean visual order in gallery?
      // But skip logic specifically asked for "next unvoted popular item".
      
      // For initial selection, standard logic:
      setSelectedListing(listings[0] || null);
      return;
    }

    const stillExists = listings.some((item) => item.id === selectedListing.id);
    if (!stillExists) {
      setSelectedListing(listings[0] || null);
    }
  }, [listings, selectedListing]);

  const autoSkipAfterVote = () => {
    if (!userId) {
      console.log('[AutoSkip] No userId, skipping auto-skip');
      return;
    }

    console.log('[AutoSkip] Starting auto-skip process');
    console.log('[AutoSkip] Current selected listing ID:', selectedListing?.id, 'name:', selectedListing?.name);
    console.log('[AutoSkip] User has voted on this item:', selectedListing?.userVotes?.[userId] ? 'yes' : 'no');
    console.log('[AutoSkip] Total listings:', listings.length);

    // Force re-sort by creating a new sorted array (to ensure we have updated vote data)
    const reSortedListings = [...listings].sort((a, b) => {
      const votesA = a.totalVotes ?? (a.votes ? Object.values(a.votes).reduce((sum, v) => sum + v, 0) : 0);
      const votesB = b.totalVotes ?? (b.votes ? Object.values(b.votes).reduce((sum, v) => sum + v, 0) : 0);
      if (votesA !== votesB) return votesB - votesA;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    console.log('[AutoSkip] Re-sorted listings count:', reSortedListings.length);

    // Find next unvoted item from re-sorted list
    // Also exclude the current item to avoid re-selecting it if state is stale
    const unvotedItems = reSortedListings.filter(item => {
      const hasVoted = item.userVotes?.[userId];
      const isCurrentItem = item.id === selectedListing?.id;
      console.log('[AutoSkip] Checking item:', item.id, item.name, 'hasVoted:', hasVoted ? 'yes' : 'no', 'isCurrentItem:', isCurrentItem);
      return item && !hasVoted && !isCurrentItem;
    });

    console.log('[AutoSkip] Unvoted items found:', unvotedItems.length);
    unvotedItems.forEach((item, i) => {
      console.log(`[AutoSkip] Unvoted item ${i}:`, item.id, item.name, 'votes:', item.totalVotes);
    });

    if (unvotedItems.length > 0) {
      // Get the most popular unvoted item (already sorted by votes desc, then newest)
      const nextItem = unvotedItems[0] as Listing;
      console.log('[AutoSkip] Selecting most popular unvoted item:', nextItem.id, nextItem.name, 'votes:', nextItem.totalVotes);
      handleThumbnailClick(nextItem);
      console.log('[AutoSkip] handleThumbnailClick called, new selectedListing should be:', nextItem.id);
      // Hide loader immediately when next item is shown
      setIsAutoSkipping(false);
      console.log('[AutoSkip] Loader hidden');
    } else {
      // All items voted, show completion modal
      console.log('[AutoSkip] All items voted, showing completion modal');
      setIsAutoSkipping(false);
      setShowCompletionModal(true);
    }
  };

  const handleVote = async (tierName: string) => {
    if (!selectedListing || isVoting || userVote) {
      console.log('[handleVote] Aborting vote:', { hasSelectedListing: !!selectedListing, isVoting, hasUserVote: !!userVote });
      return;
    }
    setIsVoting(true);
    setVotingTier(tierName);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedListing.id, tier: tierName, appId }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.log('[handleVote] Vote API error:', res.status, errorData.message);
        if (res.status === 403 && errorData.message === 'Voting has expired') {
          alert('Voting has expired. You can no longer vote.');
        } else if (res.status === 409) {
          // Already voted - refresh to get updated state and don't auto-skip
          console.log('[handleVote] Already voted, refreshing state');
          await refreshSelectedListing(selectedListing.id);
          setIsAutoSkipping(false);
          return;
        } else {
          throw new Error(errorData.message || 'Failed to submit vote');
        }
        return;
      }
      console.log('[handleVote] Vote successful, tier:', tierName);
      setLastVotedTier(tierName);
      await refreshSelectedListing(selectedListing.id);
      // Start the loader immediately so user can see their vote
      setIsAutoSkipping(true);
      console.log('[handleVote] Loader started');
      // After 1 second (loader completes), auto-skip to next item
      setTimeout(() => {
        console.log('[AutoSkip] Loader finished, now skipping to next item');
        autoSkipAfterVote();
      }, 1000);
    } catch (error) {
      console.error('Error submitting vote', error);
      setIsAutoSkipping(false);
    } finally {
      setIsVoting(false);
      setVotingTier(null);
    }
  };

  const handleThumbnailClick = (item: Listing) => {
    console.log('[handleThumbnailClick] Setting selectedListing to:', item.id, item.name);
    setSelectedListing(item);
    setShowReportForm(false);
    setReportReason('');
    setReportNotes('');
  };

  const handleReportSubmit = async () => {
    if (!selectedListing || isReporting) return;

    if (!userId) {
      showToast('You need to be signed in to report an item.');
      return;
    }

    const reason = reportReason.trim();
    const notes = reportNotes.trim();
    if (!reason) {
      showToast('Reason is required.');
      return;
    }

    setIsReporting(true);
    try {
      const res = await fetch(`/api/reports/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing.id,
          listingName: selectedListing.name,
          listingImageUrl: selectedListing.imageUrl,
          category: selectedListing.category,
          issue: reason,
          comment: notes || undefined,
          reporterId: userId,
          reporterName: displayName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'Could not send report. Please try again.';
        showToast(msg);
        return;
      }

      showToast({ text: 'Report Submitted', appearance: 'success' });
      setShowReportForm(false);
      setReportReason('');
      setReportNotes('');
    } catch (error) {
      console.error('Error reporting item', error);
      showToast('Could not send report. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };

  const handleSkip = () => {
    if (!sortedByVotesListings.length || !userId) return;

    // Check if ALL items are voted first
    const unvotedItems = sortedByVotesListings.filter(item => item && !item.userVotes?.[userId]);
    
    if (unvotedItems.length === 0) {
      // All items are voted!
      // Check if we are currently on an unvoted listing (impossible if filtered correctly, but safely)
      // Logic: If user clicks skip and everything is voted, show completion.
      setShowCompletionModal(true);
      return;
    }

    const currentIndex = selectedListing
      ? sortedByVotesListings.findIndex((item) => item.id === selectedListing.id)
      : -1;

    // Search for next unvoted item relative to current position (wrapping)
    // We look forward first, then from start
    let nextUnvoted: Listing | undefined;

    // 1. Forward search
    for (let i = currentIndex + 1; i < sortedByVotesListings.length; i++) {
        const item = sortedByVotesListings[i];
        if (item && !item.userVotes?.[userId]) {
            nextUnvoted = item;
            break;
        }
    }

    // 2. Wrap search (if not found forward)
    if (!nextUnvoted) {
      for (let i = 0; i < currentIndex; i++) {
        const item = sortedByVotesListings[i];
        if (item && !item.userVotes?.[userId]) {
            nextUnvoted = item;
            break;
        }
      }
    }

    if (nextUnvoted) {
      handleThumbnailClick(nextUnvoted);
    } else {
      // Should not be reachable if unvotedItems.length > 0, but safe fallback
      setShowCompletionModal(true);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E1113] text-white px-4 py-2 md:px-2 md:py-3 relative">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-4 md:gap-4">
        {selectedListing ? (
          <>
            <div className="w-full sm:basis-1/2 pt-3">
              <SelectedListing
                listing={selectedListing as Listing}
                categoryName={selectedListingCategoryName ?? 'Uncategorized'}
                isVotingLive={!isExpired}
              />
            </div>

            <div className="w-full sm:basis-1/2 sm:pt-2 pt-0 sm:px-0 px-1 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="space-y-0.5">
                  <p className="text-base font-semibold">Submit Vote</p>
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">{totalVotes} Votes</span>
              </div>

              <div className="">
                <TierButtons
                  tiers={tiers}
                  selectedListing={selectedListing as Listing}
                  totalVotes={totalVotes}
                  showResults={showResults}
                  isVoting={isVoting}
                  votingTier={votingTier}
                  userVote={userVote}
                  lastVotedTier={lastVotedTier}
                  onVote={handleVote}
                  isExpired={isExpired}
                />
              </div>
              <SkipReport
                onSkip={handleSkip}
                onToggleReport={() => setShowReportForm((open) => !open)}
              />
            </div>
          </>
        ) : (
          <div className="max-w-md w-full text-center border border-white/15 rounded-xl px-6 py-10 text-gray-300 bg-[#0b0b0b] mx-auto">
            No listings available.
          </div>
        )}
      </div>

      <ReportFormDialog
        isOpen={showReportForm}
        reportIssue={reportReason}
        reportNotes={reportNotes}
        isReporting={isReporting}
        userId={userId}
        onClose={() => setShowReportForm(false)}
        onReportIssueChange={setReportReason}
        onReportNotesChange={setReportNotes}
        onSubmitReport={handleReportSubmit}
      />

      <div className="max-w-5xl mx-auto border-b border-[#5D6263] my-4" />

      <VotingGallery
        listings={filteredListings}
        selectedId={selectedListing?.id || null}
        onSelect={handleThumbnailClick}
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        sortLatestFirst={sortLatestFirst}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onSearchChange={setSearchTerm}
        onCategoryChange={setCategoryFilter}
        onSortToggle={() => setSortLatestFirst((value) => !value)}
      />

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onSuggest={() => setShowSuggestionForm(true)}
      />

      {/* Suggestion Form invoked from Completion Modal */}
      <SuggestionFormDialog
        isOpen={showSuggestionForm}
        isEditing={false}
        categories={categories}
        otherCategories={otherCategories}
        initialValues={undefined}
        submitting={suggestionSubmitting}
        onClose={() => setShowSuggestionForm(false)}
        onSubmit={async (values) => {
          setSuggestionSubmitting(true);
          const created = await createSuggestion({
            ...values,
            url: values.url || '',
            notes: values.notes || '',
            customCategory: values.customCategory || ''
          });
          setSuggestionSubmitting(false);
          if (created) {
            setShowSuggestionForm(false);
            setShowCompletionModal(false); // Can close completion modal too
            showToast({ text: 'Submitted Successfully', appearance: 'success' });
            refetchCategories(); // Refresh categories
          } else {
            showToast('Failed to suggest item. Please try again.');
          }
        }}
        titleOverride="Suggest an Item"
        subtitleOverride="Upload an image, name it, and place it in a category. We'll route it to moderators."
      />
    </div>
  );
};
