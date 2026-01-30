import { useState, useCallback, useEffect } from 'react';
import { Listing } from '../../shared/types/api';

export interface CreateListingInput {
  name: string;
  imageUrl: string;
  categoryId: string;
  category?: string | undefined;
  url?: string | undefined;
}

export interface UpdateListingInput extends Partial<CreateListingInput> {}

export const useListings = (appId: string) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = `/api/listings/${appId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        const listingData = data.data as Listing[];

        // Sort by totalVotes DESC, then by createdAt DESC (most recent first)
        const sortedListings = listingData.sort((a, b) => {
          // Sort by totalVotes DESC
          const votesA = a.totalVotes ?? 0;
          const votesB = b.totalVotes ?? 0;
          if (votesA !== votesB) return votesB - votesA;

          // Then by createdAt DESC (most recent first)
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setListings(sortedListings);
      } else {
        setError(data.message || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const createListing = useCallback(
    async (input: CreateListingInput) => {
      try {
        const response = await fetch(`/api/listings/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const data = await response.json();

        if (data.status === 'success' && data.listing) {
          const listing = data.listing as Listing;
          setListings((prev) => [...prev, listing]);
          return listing;
        } else {
          setError(data.message || 'Failed to create listing');
          return null;
        }
      } catch (err) {
        console.error('Error creating listing:', err);
        setError('Failed to create listing');
        return null;
      }
    },
    [appId]
  );

  const updateListing = useCallback(
    async (listingId: string, updates: UpdateListingInput) => {
      try {
        const response = await fetch(`/api/listings/${appId}/${listingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (data.status === 'success' && data.listing) {
          const updated = data.listing as Listing;
          setListings((prev) => prev.map((l) => (l.id === listingId ? updated : l)));
          return updated;
        } else {
          setError(data.message || 'Failed to update listing');
          return null;
        }
      } catch (err) {
        console.error('Error updating listing:', err);
        setError('Failed to update listing');
        return null;
      }
    },
    [appId]
  );

  const deleteListing = useCallback(
    async (listingId: string) => {
      try {
        const response = await fetch(`/api/listings/${appId}/${listingId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.status === 'success') {
          setListings((prev) => prev.filter((l) => l.id !== listingId));
          return true;
        } else {
          setError(data.message || 'Failed to delete listing');
          return false;
        }
      } catch (err) {
        console.error('Error deleting listing:', err);
        setError('Failed to delete listing');
        return false;
      }
    },
    [appId]
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    error,
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
  };
};
