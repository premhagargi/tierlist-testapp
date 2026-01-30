export type AuthResponse = {
  type: 'auth';
  authenticated: boolean;
  username?: string;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  karma?: {
    total: number;
    post: number;
    comment: number;
  };
};

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface CategoryResponse {
  status: string;
  data?: Category[];
  category?: Category;
  message?: string;
}

export interface Moderator {
  id: string;
  username: string;
  avatarUrl: string;
  modSince: string;
  permissions: string[];
  /**
   * Where this moderator comes from:
   * - 'installer'  => app installer, permanent
   * - 'subreddit'  => subreddit moderator, permanent
   * - 'app'        => added via Tier Lister UI, can be removed
   * - 'system'     => system/default mods (e.g. dev), removable
   */
  source?: 'installer' | 'subreddit' | 'app' | 'system';
}

export interface ModsResponse {
  status: string;
  data?: Moderator[];
  subreddit?: string;
  isSubredditModerator?: boolean;
  message?: string;
}

// Super admin username - has access to all apps but not displayed in UI
export const SUPER_ADMIN_USERNAME = '';

export interface AppMetaResponse {
  status: string;
  appId: string;
  subreddit?: string;
  subredditId?: string;
  installerId?: string;
  installerUsername?: string;
  createdAt?: string;
  postUrl?: string | undefined;
  message?: string;
}

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface Suggestion {
  id: string;
  appId: string;
  name: string;
  imageUrl: string;
  url?: string;
  notes?: string;
  customCategory?: string;
  categoryId: string;
  status: SuggestionStatus;
  autoApproved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionsResponse {
  status: string;
  data?: Suggestion[];
  suggestion?: Suggestion;
  message?: string;
}

export interface Listing {
  id: string;
  appId: string;
  name: string | undefined;
  imageUrl: string;
  categoryId: string;
  category?: string | undefined;
  url?: string | undefined;
  createdAt: string;
  updatedAt: string;
  votes?: Record<string, number>;
  totalVotes?: number;
  userVotes?: Record<string, string>;
}

export interface ListingsResponse {
  status: string;
  data?: Listing[];
  listing?: Listing;
  message?: string;
}

export type ReportStatus = 'action-needed';

export interface Report {
  id: string;
  appId: string;
  reporterId: string;
  reporterName?: string;
  listingId: string;
  listingName?: string;
  listingImageUrl?: string;
  category?: string;
  issue: string;
  comment?: string;
  status: ReportStatus;
  actionTaken?: 'remove' | 'edit' | 'ignore';
  createdAt: string;
  resolvedAt?: string;
  listingUrl?: string;
}

export interface ReportsResponse {
  status: string;
  data?: Report[];
  report?: Report;
  message?: string;
}
