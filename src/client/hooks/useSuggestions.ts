import { useState, useCallback, useEffect } from 'react';
import { Suggestion, SuggestionStatus } from '../../shared/types/api';

export interface CreateSuggestionInput {
  name: string;
  imageUrl: string;
  url?: string;
  notes?: string;
  customCategory?: string;
  categoryId: string;
}

export interface UpdateSuggestionInput extends Partial<CreateSuggestionInput> {
  status?: SuggestionStatus;
}

export const useSuggestions = (appId: string) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/suggestions/${appId}`);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        setSuggestions(data.data as Suggestion[]);
      } else {
        setError(data.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const createSuggestion = useCallback(
    async (input: CreateSuggestionInput) => {
      try {
        const response = await fetch(`/api/suggestions/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const data = await response.json();

        if (data.status === 'success' && data.suggestion) {
          const suggestion = data.suggestion as Suggestion;
          setSuggestions((prev) => [...prev, suggestion]);
          return suggestion;
        } else {
          setError(data.message || 'Failed to create suggestion');
          return null;
        }
      } catch (err) {
        console.error('Error creating suggestion:', err);
        setError('Failed to create suggestion');
        return null;
      }
    },
    [appId]
  );

  const updateSuggestion = useCallback(
    async (suggestionId: string, updates: UpdateSuggestionInput) => {
      try {
        const response = await fetch(`/api/suggestions/${appId}/${suggestionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (data.status === 'success' && data.suggestion) {
          const updated = data.suggestion as Suggestion;
          setSuggestions((prev) => prev.map((s) => (s.id === suggestionId ? updated : s)));
          return updated;
        } else {
          setError(data.message || 'Failed to update suggestion');
          return null;
        }
      } catch (err) {
        console.error('Error updating suggestion:', err);
        setError('Failed to update suggestion');
        return null;
      }
    },
    [appId]
  );

  const setSuggestionStatus = useCallback(
    async (suggestionId: string, status: SuggestionStatus) => {
      return updateSuggestion(suggestionId, { status });
    },
    [updateSuggestion]
  );

  const deleteSuggestion = useCallback(
    async (suggestionId: string) => {
      try {
        const response = await fetch(`/api/suggestions/${appId}/${suggestionId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.status === 'success') {
          setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
          return true;
        } else {
          setError(data.message || 'Failed to delete suggestion');
          return false;
        }
      } catch (err) {
        console.error('Error deleting suggestion:', err);
        setError('Failed to delete suggestion');
        return false;
      }
    },
    [appId]
  );

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;

  return {
    suggestions,
    loading,
    error,
    pendingCount,
    fetchSuggestions,
    createSuggestion,
    updateSuggestion,
    setSuggestionStatus,
    deleteSuggestion,
  };
};
