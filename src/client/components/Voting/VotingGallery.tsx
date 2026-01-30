import { useRef, useState, useEffect, useMemo } from 'react';
import type { Listing } from './types';

interface VotingGalleryProps {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (listing: Listing) => void;
  searchTerm: string;
  categoryFilter: string;
  sortLatestFirst: boolean;
  categories: { id?: string; name: string }[];
  categoriesLoading: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortToggle: () => void;
}

export const VotingGallery = ({
  listings,
  selectedId,
  onSelect,
  searchTerm,
  categoryFilter,
  categories,
  categoriesLoading,
  onSearchChange,
  onCategoryChange,
}: VotingGalleryProps) => {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterType, setFilterType] = useState<'recent' | 'alphabetical' | 'popular'>('recent');
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!categoryMenuOpen && !filterMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryMenuOpen, filterMenuOpen]);

  const normalize = (value?: string) => (value ? value.trim().toLowerCase() : '');

  const categoriesById = useMemo(() => {
    const base = {
      ...Object.fromEntries(categories.map((cat) => [cat.id ?? cat.name, cat.name])),
      '__others__': 'Others',
    } as Record<string, string>;

    listings.forEach((listing) => {
      if (listing.category && listing.category.startsWith('Others - ')) {
        base[listing.category] = listing.category;
      }
    });
    return base;
  }, [categories, listings]);

  const categoryLabel = useMemo(() => {
    if (categoryFilter === 'all') return 'All categories';
    return (
      categoriesById[categoryFilter] ??
      categories.find((cat) => (cat.id ?? cat.name) === categoryFilter)?.name ??
      (categoryFilter === '__others__' ? 'Others' : 'Unknown')
    );
  }, [categories, categoriesById, categoryFilter]);

  const filteredAndSortedListings = useMemo(() => {
    const filtered = listings.filter((item) => {
      if (categoryFilter && categoryFilter !== 'all') {
        const itemCategoryId = normalize(item.categoryId);
        const itemCategoryName = normalize(item.category);
        const targetId = normalize(categoryFilter);
        const targetName = normalize(categoryLabel);

        const matchesId =
          itemCategoryId && (itemCategoryId === targetId || itemCategoryId === targetName);
        const matchesName =
          itemCategoryName && (itemCategoryName === targetId || itemCategoryName === targetName);

        if (!matchesId && !matchesName) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        if (!normalize(item.name).includes(normalize(searchTerm))) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (filterType === 'alphabetical') {
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
      }
      if (filterType === 'popular') {
        const votesA =
          a.totalVotes ?? (a.votes ? Object.values(a.votes).reduce((sum, v) => sum + v, 0) : 0);
        const votesB =
          b.totalVotes ?? (b.votes ? Object.values(b.votes).reduce((sum, v) => sum + v, 0) : 0);

        // Sort by votes first (descending)
        if (votesA !== votesB) return votesB - votesA;

        // If votes are equal, sort by most recent
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      // Recent: sort by date
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [listings, categoryFilter, categoryLabel, searchTerm, filterType]);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-0 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-slate-300 text-sm">
        <p className="text-base font-semibold text-white">Browse Items</p>
        <span>{filteredAndSortedListings.length} Items</span>
      </div>

      {/* Controls: always one line on mobile, spaced on desktop */}
      <div className="flex flex-row items-center gap-2 w-full">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search items..."
          className="flex-1 min-w-0 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2A3236] [&::-webkit-search-cancel-button]:brightness-0 [&::-webkit-search-cancel-button]:invert"
        />
        <div className="flex flex-row gap-2 flex-shrink-0">
          <div className="relative" ref={categoryMenuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              onClick={() => setCategoryMenuOpen((open) => !open)}
              disabled={categoriesLoading && categories.length === 0}
              className="inline-flex items-center justify-between w-[95px] sm:w-[180px] rounded-xl border border-white/20 px-2 sm:px-3 py-2 text-sm sm:text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2A3236] disabled:opacity-50 cursor-pointer"
            >
              <span className="truncate text-left">
                {categoryFilter === 'all' ? 'All categories' : categoryLabel}
              </span>
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
                className={`transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {categoryMenuOpen && (
              <div
                className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] shadow-xl animate-in fade-in-0 zoom-in-95 scrollbar-thin scrollbar-thumb-[#1A1F25] hover:scrollbar-thumb-[#23292F] scrollbar-track-[#0E1113] scrollbar-thumb-rounded-full"
                role="listbox"
              >
                <button
                  type="button"
                  role="option"
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5 ${
                    categoryFilter === 'all' ? 'text-white bg-white/5' : 'text-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-[#2A3236]`}
                  onClick={() => {
                    onCategoryChange('all');
                    setCategoryMenuOpen(false);
                  }}
                >
                  All categories
                </button>
                {[...categories]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((cat) => (
                    <button
                      key={cat.id ?? cat.name}
                      type="button"
                      role="option"
                      className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5 ${
                        categoryFilter === (cat.id ?? cat.name)
                          ? 'text-white bg-white/5'
                          : 'text-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-[#2A3236]`}
                      onClick={() => {
                        onCategoryChange(cat.id ?? cat.name);
                        setCategoryMenuOpen(false);
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                <button
                  type="button"
                  role="option"
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5 ${
                    categoryFilter === '__others__' ? 'text-white bg-white/5' : 'text-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-[#2A3236]`}
                  onClick={() => {
                    onCategoryChange('__others__');
                    setCategoryMenuOpen(false);
                  }}
                >
                  Others
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={filterMenuOpen}
              onClick={() => setFilterMenuOpen((open) => !open)}
              className="inline-flex items-center justify-between w-[85px] sm:w-[160px] rounded-xl border border-white/20 px-2 sm:px-3 py-2 text-sm sm:text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2A3236] cursor-pointer"
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
                className={`transition-transform ${filterMenuOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {filterMenuOpen && (
              <div
                className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] shadow-xl animate-in fade-in-0 zoom-in-95 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                role="listbox"
              >
                {[
                  { value: 'recent' as const, label: 'Recent' },
                  { value: 'alphabetical' as const, label: 'Alphabetical' },
                  { value: 'popular' as const, label: 'Popular' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5 ${
                      filterType === option.value ? 'text-white bg-white/5' : 'text-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#2A3236]`}
                    onClick={() => {
                      setFilterType(option.value);
                      setFilterMenuOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-0">
        {filteredAndSortedListings.map((item) => (
          <button
            key={item.id}
            type="button"
            className="relative h-24 min-w-[64px] max-w-[160px] overflow-hidden transition cursor-pointer group"
            onClick={() => onSelect(item)}
            title={item.name}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-auto object-contain mx-auto"
              />
            ) : (
              <div className="w-full h-full border border-dashed border-white/15 flex items-center justify-center text-[9px] uppercase tracking-[0.08em] text-slate-500">
                No image
              </div>
            )}
            <span
              className={`absolute inset-0 flex items-center justify-center bg-black/50 transition text-xs font-semibold text-white text-center px-2 pointer-events-none ${
                selectedId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {item.name}
            </span>
          </button>
        ))}
        {!filteredAndSortedListings.length && (
          <div className="w-full text-center text-sm text-slate-400 py-8">
            No listings match your filters.
          </div>
        )}
      </div>
    </div>
  );
};
