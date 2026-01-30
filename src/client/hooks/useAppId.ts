import { useEffect, useState } from 'react';
import { AppMetaResponse } from '../../shared/types/api';
import { usePost } from '../context/PostContext';

export const useAppId = () => {
  const [appId, setAppId] = useState<string | null>(null);
  const [installerUsername, setInstallerUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { postId, loading: postLoading, error: postError } = usePost();

  useEffect(() => {
    const fetchAppId = async () => {
      try {
        if (postLoading) {
          setLoading(true);
          return;
        }

        if (postError || !postId) {
          setError('Could not resolve app id for this post');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const res = await fetch(`/api/app?postId=${encodeURIComponent(postId)}`);
        const data: AppMetaResponse = await res.json();

        if (!res.ok || data.status !== 'success' || !data.appId) {
          throw new Error(data.message || 'Failed to resolve app id');
        }

        setAppId(data.appId);
        setInstallerUsername(data.installerUsername ?? null);
      } catch (err) {
        console.error('Failed to resolve app id:', err);
        setError('Could not resolve app id for this subreddit');
      } finally {
        setLoading(false);
      }
    };

    void fetchAppId();
  }, [postId, postLoading, postError]);

  return { appId, installerUsername, loading, error };
};
