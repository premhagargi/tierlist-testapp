import { useState, useMemo, useEffect, useRef } from 'react';
import { showToast } from '@devvit/web/client';
import { DeleteDialog } from '../../DeleteDialog';
// import { useCategories } from '../../../hooks/useCategories';
// import { useListings } from '../../../hooks/useListings';
import { Listing } from '../../../../shared/types/api';
import { ListingList } from './ListingList';
import type { Category } from '../../../../shared/types/api';

interface ListingsSectionProps {
  appId: string;
  listings: Listing[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => Promise<void> | void;
}

export const ListingsSection = ({
  listings,
  categories,
  loading,
  error,
  onEdit,
  onDelete,
}: ListingsSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filterType, setFilterType] = useState<'recent' | 'alphabetical' | 'popular'>('recent');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const filteredListings: Listing[] = useMemo(() => {
    const query = normalize(searchQuery);

    const filtered = listings.filter((listing) => {
      const matchesSearch = query ? normalize(listing.name).includes(query) : true;

      const matchesCategory =
        categoryFilter === 'all'
          ? true
          : normalize(listing.categoryId) === normalize(categoryFilter);

      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (filterType === 'alphabetical') {
        const nameA = a.name || '';
        const nameB = b.name || '';

        // Check if names start with numbers
        const startsWithNumberA = /^\d/.test(nameA);
        const startsWithNumberB = /^\d/.test(nameB);

        // Check if names are empty/unknown
        const isEmptyA = !nameA.trim();
        const isEmptyB = !nameB.trim();

        console.log('Comparing:', {
          nameA: nameA || '(empty)',
          nameB: nameB || '(empty)',
          isEmptyA,
          isEmptyB,
          startsWithNumberA,
          startsWithNumberB,
        });

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
        const votesA = a.totalVotes ?? 0;
        const votesB = b.totalVotes ?? 0;

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

    console.log(
      'Final sorted listings:',
      sorted.map((l) => ({ id: l.id, name: l.name || '(empty)' }))
    );
    return sorted;
  }, [listings, searchQuery, categoryFilter, filterType]);

  return (
    <div className="space-y-4 text-left px-2 sm:px-2">
      <div className="flex flex-col gap-2">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-lg font-semibold text-white leading-tight">
            Manage Items
          </h2>
          <p className="text-sm text-[--color-text-subtle] max-w-2xl">
            Edit item details or delete items from the list.
          </p>
        </div>
      </div>

      <ListingList
        listings={filteredListings}
        categories={categories}
        loading={loading}
        error={error}
        onEdit={onEdit}
        onDelete={(id) => {
          const listing = listings.find((l) => l.id === id);
          setDeletingId(id);
          setDeletingName(listing?.name || '');
        }}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={!!deletingId}
        onClose={() => {
          setDeletingId(null);
          setDeletingName('');
        }}
        title="Delete Item"
        message="Are you sure you want to delete {itemName}? This action cannot be undone."
        itemName={deletingName}
        isDeleting={isDeleting}
        onConfirm={async () => {
          if (!deletingId) return;
          setIsDeleting(true);
          try {
            await onDelete(deletingId);
            showToast({ text: 'Item Deleted', appearance: 'success' });
          } catch {
            showToast('Failed to delete item. Please try again.');
          }
          setIsDeleting(false);
          setDeletingId(null);
          setDeletingName('');
        }}
      />
    </div>
  );
};
