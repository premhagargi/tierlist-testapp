import { Ban, Grid2X2, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Listing, Category } from '../../../../shared/types/api';
import { LoadingSpinner } from '../../LoadingSpinner';

type ListingListProps = {
  listings: Listing[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: string) => Promise<void> | void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (value: string) => void;
  filterType?: 'recent' | 'alphabetical' | 'popular';
  onFilterTypeChange?: (value: 'recent' | 'alphabetical' | 'popular') => void;
};

const emptyStateMessage = 'No listings yet. Create your first item to get started.';
const ITEMS_PER_PAGE = 20;

export const ListingList = ({
  listings,
  categories,
  loading,
  error,
  onEdit,
  onDelete,
  searchTerm = '',
  onSearchChange,
  categoryFilter = 'all',
  onCategoryChange,
  filterType = 'recent',
  onFilterTypeChange,
}: ListingListProps) => {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && displayCount < listings.length) {
          setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, listings.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, listings.length]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [listings.length, searchTerm, categoryFilter]);

  const categoryNameFor = (listing: Listing) => {
    if (listing.category) return listing.category;
    if (listing.categoryId === '__others__') return 'Others';
    const cat = categories.find((c) => c.id === listing.categoryId);
    return cat?.name || 'Others';
  };

  const actionButtonBase =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/40';

  // Local dropdown components to mirror VotingGallery UI
  const CategoryFilterDropdown = ({
    categories,
    categoryFilter,
    onCategoryChange,
  }: {
    categories: Category[];
    categoryFilter?: string;
    onCategoryChange?: ((v: string) => void) | undefined;
  }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) return;
      const onDoc = (ev: MouseEvent) => {
        if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const label =
      categoryFilter === 'all'
        ? 'All categories'
        : categoryFilter === '__others__'
          ? 'Others'
          : (categoriesById[categoryFilter ?? ''] ?? categoryFilter ?? 'All categories');

    return (
      <div className="relative" ref={ref} style={{ width: 180 }}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-between w-full rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2A3236] cursor-pointer"
        >
          <span className="text-slate-100 truncate">{label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] shadow-xl scrollbar-thin scrollbar-thumb-[#1A1F25] hover:scrollbar-thumb-[#23292F] scrollbar-track-[#0E1113] scrollbar-thumb-rounded-full">
            <button
              type="button"
              role="option"
              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 cursor-pointer ${categoryFilter === 'all' ? 'text-white bg-white/5' : 'text-slate-200'}`}
              onClick={() => {
                onCategoryChange?.('all');
                setOpen(false);
              }}
            >
              All categories
            </button>
            {[...categories]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="option"
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 cursor-pointer ${categoryFilter === cat.id ? 'text-white bg-white/5' : 'text-slate-200'}`}
                  onClick={() => {
                    onCategoryChange?.(cat.id);
                    setOpen(false);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            <button
              type="button"
              role="option"
              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 cursor-pointer ${categoryFilter === '__others__' ? 'text-white bg-white/5' : 'text-slate-200'}`}
              onClick={() => {
                onCategoryChange?.('__others__');
                setOpen(false);
              }}
            >
              Others
            </button>
          </div>
        )}
      </div>
    );
  };

  const FilterDropdown = ({
    filterType,
    onFilterTypeChange,
  }: {
    filterType?: 'recent' | 'alphabetical' | 'popular';
    onFilterTypeChange?: ((v: 'recent' | 'alphabetical' | 'popular') => void) | undefined;
  }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      if (!open) return;
      const onDoc = (ev: MouseEvent) => {
        if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const options = [
      { value: 'recent', label: 'Recent' },
      { value: 'alphabetical', label: 'Alphabetical' },
      { value: 'popular', label: 'Popular' },
    ];

    return (
      <div className="relative" ref={ref} style={{ width: 160 }}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-between w-full rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2A3236] cursor-pointer"
        >
          <span className="text-slate-100 capitalize">{filterType}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b] shadow-xl">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 cursor-pointer ${filterType === opt.value ? 'text-white bg-white/5' : 'text-slate-200'}`}
                onClick={() => {
                  onFilterTypeChange?.(opt.value as any);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Filtering, searching, and sorting logic
  let filteredListings = listings;
  if (categoryFilter && categoryFilter !== 'all') {
    filteredListings = filteredListings.filter(
      (l) => l.categoryId === categoryFilter || l.category === categoryFilter
    );
  }
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    filteredListings = filteredListings.filter((l) => (l.name || '').toLowerCase().includes(term));
  }
  if (filterType === 'alphabetical') {
    filteredListings = [...filteredListings].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';

      // Check if names start with numbers
      const startsWithNumberA = /^\d/.test(nameA);
      const startsWithNumberB = /^\d/.test(nameB);

      // Check if names are empty/unknown
      const isEmptyA = !nameA.trim();
      const isEmptyB = !nameB.trim();

      // Empty names go last
      if (isEmptyA && !isEmptyB) return 1;
      if (!isEmptyA && isEmptyB) return -1;
      if (isEmptyA && isEmptyB) {
        // If both names are empty/unknown, fall back to most recent
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }

      // Numbers come before letters
      if (startsWithNumberA && !startsWithNumberB) return -1;
      if (!startsWithNumberA && startsWithNumberB) return 1;

      // Both same type, compare normally
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  } else if (filterType === 'popular') {
    filteredListings = [...filteredListings].sort((a, b) => {
      const votesA =
        a.totalVotes ?? (a.votes ? Object.values(a.votes).reduce((sum, v) => sum + v, 0) : 0);
      const votesB =
        b.totalVotes ?? (b.votes ? Object.values(b.votes).reduce((sum, v) => sum + v, 0) : 0);
      return votesB - votesA;
    });
  } else {
    filteredListings = [...filteredListings].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  const visibleListings = filteredListings.slice(0, displayCount);
  const hasMore = displayCount < filteredListings.length;

  return (
    <div className="mt-4 space-y-3">
      {/* Controls row: search, category, filter styled like VotingGallery */}
      <div className="flex w-full items-center gap-3 mb-2">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search listings..."
          className="w-full min-w-0 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2A3236]"
          style={{ maxWidth: '100%' }}
        />
        {/* Category dropdown styled like VotingGallery */}
        <CategoryFilterDropdown
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange ?? undefined}
        />
        {/* Filter dropdown styled like VotingGallery */}
        <FilterDropdown
          filterType={filterType}
          onFilterTypeChange={onFilterTypeChange ?? undefined}
        />
      </div>

      {loading && <LoadingSpinner size={40} centered />}

      {error && (
        <div className="p-3 rounded-lg border border-red-400/40 bg-red-500/10 text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-[#0c0f14] p-4 shadow-inner">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#648EFC1A] text-[#9CC2FF]">
            <Ban size={26} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-white">No listings yet.</p>
            <p className="text-[14px] text-[--color-text-subtle]">{emptyStateMessage}</p>
          </div>
        </div>
      )}

      {!loading && !error && filteredListings.length === 0 && listings.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-[#0c0f14] p-4 shadow-inner">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#648EFC1A] text-[#9CC2FF]">
            <Ban size={26} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-white">No results found.</p>
            <p className="text-[14px] text-[--color-text-subtle]">
              Try adjusting your search or filters.
            </p>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        visibleListings.length > 0 &&
        visibleListings.map((listing) => (
          <div
            key={listing.id}
            className="relative flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-500 p-3 sm:p-4 bg-transparent text-[14px]"
          >
            <div className="relative w-24 h-24 sm:w-24 sm:h-24 aspect-square overflow-hidden rounded-md border-2 border-gray-500 bg-black flex items-center justify-center">
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[12px] text-slate-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[16px] font-semibold text-white truncate">{listing.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[14px] text-[--color-text-subtle]">
                    <span className="inline-flex items-center gap-1 text-slate-200">
                      <Grid2X2 size={18} />
                      {categoryNameFor(listing)}
                    </span>
                  </div>
                  {listing.url && (
                    <div className="mt-1 flex items-center gap-1.5 min-w-0">
                      <ExternalLink size={17} className="flex-shrink-0 text-slate-400" />
                      <a
                        href={listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 transition-colors truncate hover:underline"
                        title={listing.url}
                      >
                        {listing.url}
                      </a>
                    </div>
                  )}{' '}
                </div>

                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-2 self-start">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(listing)}
                        className={`${actionButtonBase} hover:text-sky-300`}
                        title="Edit item"
                        aria-label="Edit item"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(listing.id)}
                        className={`${actionButtonBase} hover:text-red-300`}
                        title="Delete item"
                        aria-label="Delete item"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      {!loading && !error && hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <button
            onClick={() =>
              setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, listings.length))
            }
            className="px-4 py-2 text-sm font-semibold text-white rounded-md border border-white/40 hover:bg-white/5 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};
