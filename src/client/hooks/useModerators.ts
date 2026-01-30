import { useEffect, useMemo, useState } from 'react';
import { Moderator, SUPER_ADMIN_USERNAME } from '../../shared/types/api';

export const useModerators = (
  appId: string,
  currentUsername?: string | null,
  installerUsername?: string | null
) => {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [subreddit, setSubreddit] = useState<string | null>(null);
  const [isSubredditModerator, setIsSubredditModerator] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchModerators = async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/moderators/${appId}`);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        setModerators(data.data);
        setSubreddit(data.subreddit || null);
        setIsSubredditModerator(data.isSubredditModerator || false);
      } else {
        setError(data.message || 'Failed to fetch moderators');
      }
    } catch (err) {
      console.error('Error fetching moderators:', err);
      setError('Failed to fetch moderators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const addModerator = async (username: string) => {
    if (!appId) {
      setError('App id unavailable');
      return false;
    }

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username is required');
      return false;
    }

    try {
      setAdding(true);
      setError(null);
      const response = await fetch(`/api/moderators/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success' && data.data) {
        setModerators(data.data);
        return true;
      }

      setError(data.message || 'Failed to add moderator');
      return false;
    } catch (err) {
      console.error('Error adding moderator:', err);
      setError('Failed to add moderator');
      return false;
    } finally {
      setAdding(false);
    }
  };

  const removeModerator = async (moderatorId: string) => {
    if (!appId || !moderatorId) return false;

    try {
      setRemovingId(moderatorId);
      setError(null);

      // URL-encode the moderatorId to handle special characters like '/'
      const encodedId = encodeURIComponent(moderatorId);
      const response = await fetch(`/api/moderators/${appId}/${encodedId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.status === 'success' && data.data) {
        setModerators(data.data);
        return true;
      }

      setError(data.message || 'Failed to remove moderator');
      return false;
    } catch (err) {
      console.error('Error removing moderator:', err);
      setError('Failed to remove moderator');
      return false;
    } finally {
      setRemovingId(null);
    }
  };

  const installerName = installerUsername?.toLowerCase();

  const isInstaller = useMemo(() => {
    if (!currentUsername || !installerName) return false;
    return currentUsername.toLowerCase() === installerName;
  }, [currentUsername, installerName]);

  const isModerator = useMemo(() => {
    if (isInstaller) return true;
    // Check if user is a subreddit moderator
    if (isSubredditModerator) return true;
    if (!currentUsername) return false;
    // Check if user is the super admin
    if (currentUsername.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase()) return true;
    return moderators.some((m) => m.username.toLowerCase() === currentUsername.toLowerCase());
  }, [currentUsername, moderators, isInstaller, isSubredditModerator]);

  return {
    moderators,
    subreddit,
    loading,
    error,
    adding,
    removingId,
    addModerator,
    removeModerator,
    refresh: fetchModerators,
    isModerator,
    isInstaller,
  };
};
