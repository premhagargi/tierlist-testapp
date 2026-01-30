import { useCallback, useEffect, useState } from 'react';
import type { AuthResponse } from '../../shared/types/api';

interface AuthState {
  authenticated: boolean;
  username: string | null;
  userId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  karma: { total: number; post: number; comment: number } | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStatus = () => {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    username: null,
    userId: null,
    displayName: null,
    avatarUrl: null,
    karma: null,
    loading: true,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/auth');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AuthResponse = await res.json();

      setState({
        authenticated: data.authenticated,
        username: data.username ?? null,
        userId: data.userId ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        karma: data.karma ?? null,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Auth check failed:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Authentication failed',
      }));
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    authenticated: state.authenticated,
    username: state.username,
    userId: state.userId,
    displayName: state.displayName,
    avatarUrl: state.avatarUrl,
    karma: state.karma,
    loading: state.loading,
    error: state.error,
    refresh: checkAuth,
  };
};
