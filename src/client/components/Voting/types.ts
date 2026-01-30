export interface Listing {
  id: string;
  name: string;
  categoryId?: string;
  category?: string;
  imageUrl?: string;
  tier?: string;
  votes?: Record<string, number>;
  totalVotes?: number;
  userVotes?: Record<string, string>;
  createdAt?: string | number;
  url?: string;
}

export interface Tier {
  name: string;
  color?: string;
  colour?: string;
}
