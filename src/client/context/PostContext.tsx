import React, { createContext, useContext, useEffect, useState } from 'react';

interface PostContextValue {
  postId: string | null;
  subredditId: string | null;
  subredditName: string | null;
  loading: boolean;
  error: string | null;
}

const PostContext = createContext<PostContextValue | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [postId, setPostId] = useState<string | null>(null);
  const [subredditId, setSubredditId] = useState<string | null>(null);
  const [subredditName, setSubredditName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolvePostContext = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/init');
        const data = await res.json();

        if (!res.ok || !data || data.postId == null) {
          throw new Error(data?.message || 'Failed to resolve post context');
        }

        setPostId(data.postId ?? null);
        setSubredditId(data.subredditId ?? null);
        setSubredditName(data.subredditName ?? null);
      } catch (err) {
        console.error('[PostContext] Failed to resolve post context:', err);
        setError('Could not resolve post context for this view');
      } finally {
        setLoading(false);
      }
    };

    void resolvePostContext();
  }, []);

  const value: PostContextValue = {
    postId,
    subredditId,
    subredditName,
    loading,
    error,
  };

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};

export const usePost = (): PostContextValue => {
  const ctx = useContext(PostContext);
  if (!ctx) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return ctx;
};
