import { useState, useCallback, useEffect } from 'react';

export interface Tier {
  id: string;
  name: string;
  colour: string;
  order: number;
}

export const useTiers = (appId: string) => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tiers
  const fetchTiers = useCallback(async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = `/api/tiers/${appId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        setTiers(data.data);
      } else {
        setError(data.message || 'Failed to fetch tiers');
      }
    } catch (err) {
      console.error('Error fetching tiers:', err);
      setError('Failed to fetch tiers');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  // Create tier
  const createTier = useCallback(
    async (name: string, colour: string) => {
      try {
        const response = await fetch(`/api/tiers/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, colour }),
        });

        const data = await response.json();

        if (data.status === 'success' && data.tier) {
          setTiers((prev) => {
            const nextOrder = prev.length ? Math.max(...prev.map((t) => t.order)) + 1 : 0;
            const tierWithOrder = { ...data.tier, order: nextOrder };
            return [...prev, tierWithOrder];
          });
          return data.tier;
        } else {
          setError(data.message || 'Failed to create tier');
          return null;
        }
      } catch (err) {
        console.error('Error creating tier:', err);
        setError('Failed to create tier');
        return null;
      }
    },
    [appId]
  );

  // Update tier
  const updateTier = useCallback(
    async (tierId: string, updates: { name?: string; colour?: string; order?: number }) => {
      try {
        const response = await fetch(`/api/tiers/${appId}/${tierId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (data.status === 'success' && data.tier) {
          setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, ...data.tier } : t)));
          return data.tier;
        } else {
          setError(data.message || 'Failed to update tier');
          return null;
        }
      } catch (err) {
        console.error('Error updating tier:', err);
        setError('Failed to update tier');
        return null;
      }
    },
    [appId]
  );

  // Delete tier
  const deleteTier = useCallback(
    async (tierId: string) => {
      try {
        const response = await fetch(`/api/tiers/${appId}/${tierId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.status === 'success') {
          setTiers((prev) => prev.filter((t) => t.id !== tierId));
          return true;
        } else {
          setError(data.message || 'Failed to delete tier');
          return false;
        }
      } catch (err) {
        console.error('Error deleting tier:', err);
        setError('Failed to delete tier');
        return false;
      }
    },
    [appId]
  );

  // Reorder tiers
  const reorderTiers = useCallback(
    async (tierId: string, newOrder: number) => {
      try {
        const response = await fetch(`/api/tiers/${appId}/${tierId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newOrder }),
        });

        const data = await response.json();

        if (data.status === 'success') {
          // Refetch to get updated order for all tiers
          await fetchTiers();
          return true;
        } else {
          setError(data.message || 'Failed to reorder tier');
          return false;
        }
      } catch (err) {
        console.error('Error reordering tier:', err);
        setError('Failed to reorder tier');
        return false;
      }
    },
    [appId, fetchTiers]
  );

  // Initial fetch
  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  return {
    tiers,
    loading,
    error,
    createTier,
    updateTier,
    deleteTier,
    reorderTiers,
    refetch: fetchTiers,
  };
};
