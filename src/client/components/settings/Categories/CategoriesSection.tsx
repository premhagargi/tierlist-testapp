import { useEffect, useRef, useState } from 'react';
import { showToast } from '@devvit/web/client';
import { Check, ChevronDown, GitMerge, Grid2X2, Plus, Trash } from 'lucide-react';
import { Category } from '../../../../shared/types/api';
import { useCategories } from '../../../hooks/useCategories';
import { useSuggestions } from '../../../hooks/useSuggestions';
import { useListings } from '../../../hooks/useListings';
import { CategoriesHeader } from './CategoriesHeader';
import { CategoriesFormDialog } from './CategoriesFormDialog';
import { CategoriesList } from './CategoriesList';
import { DeleteDialog } from '../../DeleteDialog';

interface CategoriesSectionProps {
  appId: string;
}

export const CategoriesSection = ({ appId }: CategoriesSectionProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmCategory, setConfirmCategory] = useState<Category | null>(null);
  const [mergeCategory, setMergeCategory] = useState<Category | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeDropdownOpen, setMergeDropdownOpen] = useState(false);
  const mergeDropdownRef = useRef<HTMLDivElement | null>(null);
  const [mergeSuggestionName, setMergeSuggestionName] = useState<string | null>(null);
  const [mergeSuggestionTargetId, setMergeSuggestionTargetId] = useState('');
  const [mergeSuggestionModalOpen, setMergeSuggestionModalOpen] = useState(false);
  const [mergingSuggestion, setMergingSuggestion] = useState(false);
  const [deleteSuggestionName, setDeleteSuggestionName] = useState<string | null>(null);
  const [deletingSuggestion, setDeletingSuggestion] = useState(false);

  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    mergeCategory: mergeCategoryApi,
    refetch,
  } = useCategories(appId);

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    setSuggestionStatus,
    updateSuggestion,
    fetchSuggestions,
  } = useSuggestions(appId);

  const { listings, updateListing, fetchListings } = useListings(appId);

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (name: string) => {
    if (!name.trim()) {
      showToast('Please enter a category name');
      return;
    }

    setSubmitting(true);
    const ok = editingCategory
      ? await updateCategory(editingCategory.id, { name: name.trim() })
      : await createCategory(name.trim());
    setSubmitting(false);

    if (ok) {
      closeForm();
      showToast({
        text: editingCategory ? 'Changes Saved' : 'Category Added',
        appearance: 'success',
      });
    } else {
      showToast(
        editingCategory
          ? 'Failed to update category. Please try again.'
          : 'Failed to add category. Please try again.'
      );
    }
  };

  const handleDelete = async (categoryId: string) => {
    setDeletingId(categoryId);
    const ok = await deleteCategory(categoryId);
    if (!ok) {
      showToast('Failed to delete category. Please try again.');
    } else {
      await refetch();
      showToast({ text: 'Category Deleted', appearance: 'success' });
    }
    setDeletingId(null);
  };

  const handleQuickAdd = async () => {
    if (!quickName.trim()) return;
    setQuickAdding(true);
    const created = await createCategory(quickName.trim());
    setQuickAdding(false);
    if (created) {
      setQuickName('');
      showToast({ text: 'Category Added', appearance: 'success' });
    } else {
      showToast('Failed to add category. Please try again.');
    }
  };

  const availableMergeTargets = mergeCategory
    ? categories.filter((c) => c.id !== mergeCategory.id)
    : [];
  const selectedMergeTarget = availableMergeTargets.find((c) => c.id === mergeTargetId);

  useEffect(() => {
    if (!mergeDropdownOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (mergeDropdownRef.current && !mergeDropdownRef.current.contains(event.target as Node)) {
        setMergeDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMergeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mergeDropdownOpen]);

  useEffect(() => {
    if (!mergeCategory) {
      setMergeDropdownOpen(false);
    }
  }, [mergeCategory]);

  useEffect(() => {
    if (!mergeSuggestionModalOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMergeSuggestionModalOpen(false);
        setMergeSuggestionName(null);
        setMergeSuggestionTargetId('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mergeSuggestionModalOpen]);

  const handleMergeSubmit = async () => {
    if (!mergeCategory || !mergeTargetId) {
      showToast('Please select a category to merge into.');
      return;
    }

    setMerging(true);
    const ok = await mergeCategoryApi(mergeCategory.id, mergeTargetId);
    setMerging(false);

    if (ok) {
      showToast({ text: 'Category Merged', appearance: 'success' });
      setMergeCategory(null);
      setMergeTargetId('');
      await refetch();
    } else {
      showToast('Failed to merge category. Please try again.');
    }
  };

  return (
    <div className="space-y-5 px-2 sm:px-2 relative">
      <CategoriesHeader
        value={quickName}
        onChange={setQuickName}
        onSubmit={handleQuickAdd}
        disabled={quickAdding || !quickName.trim()}
      />

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {suggestionsError && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {suggestionsError}
        </div>
      )}

      <CategoriesList
        categories={categories}
        loading={loading}
        deletingId={deletingId}
        onEdit={openEdit}
        onRequestDelete={(category) => setConfirmCategory(category)}
        onRequestMerge={(category) => {
          setMergeCategory(category);
          setMergeTargetId('');
          setMergeDropdownOpen(false);
        }}
      />

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Suggestion</h3>
          {suggestionsLoading && <span className="text-xs text-gray-400">Loading…</span>}
        </div>
        <p className="text-sm text-gray-400">
          Below are the custom category names users entered under "Others." You can add them as new
          categories or merge them into an existing category.
        </p>

        <div className="mt-3 shadow-sm">
          {suggestionsLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-sm text-slate-300">Fetching suggestions…</span>
            </div>
          ) : (
            (() => {
              const relevantSuggestions = suggestions
                .filter((s) => s.customCategory && s.status !== 'rejected')
                .map((s) => ({
                  name: s.customCategory?.trim() || '',
                  categoryId: s.categoryId,
                }));

              const relevantListings = listings
                .filter((l) => l.categoryId === '__others__' && l.category?.startsWith('Others - '))
                .map((l) => ({
                  name: l.category?.replace(/^Others - /, '').trim() || '',
                  categoryId: l.categoryId,
                }));

              const names = Array.from(
                new Set([
                  ...relevantSuggestions.map((c) => c.name).filter(Boolean),
                  ...relevantListings.map((c) => c.name).filter(Boolean),
                ] as string[])
              );

              if (names.length === 0) {
                return (
                  <div className="px-3 py-3 text-sm text-slate-300">
                    No suggestion categories yet.
                  </div>
                );
              }

              return (
                <div className="divide-y divide-[#5D6263]">
                  {names.map((name) => (
                    <div
                      key={name}
                      className="relative flex items-center gap-3 px-2 py-2 transition-colors hover:bg-white/5"
                    >
                      <div className="text-slate-200">
                        <Grid2X2 size={18} />
                      </div>

                      <div className="flex-1">
                        <p className="text-slate-100">Other - {name}</p>
                      </div>

                      <button
                        onClick={async () => {
                          const created = await createCategory(name);
                          if (created) {
                            // Update all matching suggestions (pending or approved) to use the new category
                            const suggestionMatches = suggestions.filter(
                              (s) => s.customCategory?.trim() === name && s.status !== 'rejected'
                            );
                            const listingMatches = listings.filter(
                              (l) =>
                                l.categoryId === '__others__' && l.category === `Others - ${name}`
                            );

                            await Promise.all([
                              ...suggestionMatches.map((m) =>
                                updateSuggestion(m.id, {
                                  categoryId: created.id,
                                  customCategory: '',
                                  status: m.status,
                                })
                              ),
                              ...listingMatches.map((l) =>
                                updateListing(l.id, {
                                  categoryId: created.id,
                                  category: undefined,
                                })
                              ),
                            ]);

                            await Promise.all([refetch(), fetchSuggestions(), fetchListings()]);
                            showToast({ text: 'Category Added', appearance: 'success' });
                          } else {
                            showToast('Failed to add category. Please try again.');
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-sky-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Add as category"
                      >
                        <Plus size={18} />
                      </button>

                      <button
                        onClick={() => {
                          setMergeSuggestionName(name);
                          setMergeSuggestionTargetId('');
                          setMergeDropdownOpen(false);
                          setMergeSuggestionModalOpen(true);
                        }}
                        className="p-1.5 text-slate-300 hover:text-emerald-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Merge into category"
                      >
                        <GitMerge className="h-[18px] w-[18px]" />
                      </button>

                      <button
                        onClick={() => setDeleteSuggestionName(name)}
                        className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete suggestion"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>

      <CategoriesFormDialog
        isOpen={showForm}
        isEditing={Boolean(editingCategory)}
        initialName={editingCategory?.name ?? ''}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {confirmCategory && (
        <DeleteDialog
          isOpen={Boolean(confirmCategory)}
          onClose={() => setConfirmCategory(null)}
          title="Delete Category"
          message='Are you sure you want to delete {itemName} category? Items in this category will be moved to "Others" category.'
          itemName={confirmCategory.name}
          tip='Consider using "Merge Into…" to reassign items to an existing category.'
          onConfirm={async () => {
            if (confirmCategory) {
              await handleDelete(confirmCategory.id);
              setConfirmCategory(null);
            }
          }}
          isDeleting={deletingId === confirmCategory.id}
        />
      )}

      {mergeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-[#0b0f11] px-4 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-transform">
            <button
              onClick={() => setMergeCategory(null)}
              type="button"
              className="absolute top-3 right-3 h-9 w-9 rounded-full border border-white/30 text-slate-100 hover:text-white hover:border-white transition-colors cursor-pointer"
              aria-label="Close merge dialog"
            >
              ✕
            </button>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Merge "{mergeCategory.name}"</h3>
              <p className="text-sm text-slate-200 leading-6">
                Select a category to merge this subcategory into.
              </p>
              <div className="space-y-1">
                <div className="relative" ref={mergeDropdownRef}>
                  <button
                    type="button"
                    disabled={!availableMergeTargets.length}
                    onClick={() => setMergeDropdownOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={mergeDropdownOpen}
                    className="flex w-full items-center justify-between rounded-lg border border-white/25 bg-black px-3 py-3 text-left text-sm font-medium text-white shadow-[0_14px_40px_-16px_rgba(0,0,0,0.6)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <span className={selectedMergeTarget ? 'text-white' : 'text-slate-400'}>
                      {selectedMergeTarget
                        ? selectedMergeTarget.name
                        : availableMergeTargets.length
                          ? 'Select category...'
                          : 'No categories available'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                  </button>

                  {mergeDropdownOpen && availableMergeTargets.length > 0 && (
                    <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-lg border border-white/20 bg-[#0b0f11] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                      <div className="max-h-60 overflow-y-auto py-1">
                        {[...availableMergeTargets]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((cat) => {
                            const isActive = mergeTargetId === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setMergeTargetId(cat.id);
                                  setMergeDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-white/10 cursor-pointer ${
                                  isActive ? 'bg-white/10 text-white' : 'text-slate-100'
                                }`}
                                role="option"
                                aria-selected={isActive}
                              >
                                <span>{cat.name}</span>
                                {isActive && <Check className="h-4 w-4" />}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setMergeCategory(null)}
                className="flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={merging || !mergeTargetId}
                onClick={handleMergeSubmit}
                className="allow-white-bg flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {merging ? 'Merging…' : 'Merge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mergeSuggestionModalOpen && mergeSuggestionName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-[#0b0f11] px-4 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-transform">
            <button
              onClick={() => {
                setMergeSuggestionModalOpen(false);
                setMergeSuggestionName(null);
                setMergeSuggestionTargetId('');
                setMergeDropdownOpen(false);
              }}
              type="button"
              className="absolute top-3 right-3 h-9 w-9 rounded-full border border-white/30 text-slate-100 hover:text-white hover:border-white transition-colors cursor-pointer"
              aria-label="Close merge dialog"
            >
              ✕
            </button>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Merge "Other - {mergeSuggestionName}"
              </h3>
              <p className="text-sm text-slate-200 leading-6">
                Select a category to merge this suggestion into.
              </p>
              <div className="space-y-1">
                <div className="relative" ref={mergeDropdownRef}>
                  <button
                    type="button"
                    disabled={!categories.length}
                    onClick={() => setMergeDropdownOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={mergeDropdownOpen}
                    className="flex w-full items-center justify-between rounded-lg border border-white/25 bg-black px-3 py-3 text-left text-sm font-medium text-white shadow-[0_14px_40px_-16px_rgba(0,0,0,0.6)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <span className={mergeSuggestionTargetId ? 'text-white' : 'text-slate-400'}>
                      {mergeSuggestionTargetId
                        ? (categories.find((c) => c.id === mergeSuggestionTargetId)?.name ??
                          'Select category...')
                        : categories.length
                          ? 'Select category...'
                          : 'No categories available'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                  </button>

                  {mergeDropdownOpen && categories.length > 0 && (
                    <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-lg border border-white/20 bg-[#0b0f11] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                      <div className="max-h-60 overflow-y-auto py-1">
                        {[...categories]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((cat) => {
                            const isActive = mergeSuggestionTargetId === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setMergeSuggestionTargetId(cat.id);
                                  setMergeDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-white/10 cursor-pointer ${
                                  isActive ? 'bg-white/10 text-white' : 'text-slate-100'
                                }`}
                                role="option"
                                aria-selected={isActive}
                              >
                                <span>{cat.name}</span>
                                {isActive && <Check className="h-4 w-4" />}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setMergeSuggestionModalOpen(false);
                  setMergeSuggestionName(null);
                  setMergeSuggestionTargetId('');
                  setMergeDropdownOpen(false);
                }}
                className="flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mergingSuggestion || !mergeSuggestionTargetId}
                onClick={async () => {
                  if (!mergeSuggestionName || !mergeSuggestionTargetId) return;
                  setMergingSuggestion(true);

                  try {
                    // Find all suggestions and listings with this custom category
                    const suggestionMatches = suggestions.filter(
                      (s) =>
                        s.customCategory?.trim() === mergeSuggestionName && s.status !== 'rejected'
                    );
                    const listingMatches = listings.filter(
                      (l) =>
                        l.categoryId === '__others__' &&
                        l.category === `Others - ${mergeSuggestionName}`
                    );

                    // Reassign all matching items to the target category
                    await Promise.all([
                      ...suggestionMatches.map((m) =>
                        updateSuggestion(m.id, {
                          categoryId: mergeSuggestionTargetId,
                          customCategory: '',
                          status: m.status,
                        })
                      ),
                      ...listingMatches.map((l) =>
                        updateListing(l.id, {
                          categoryId: mergeSuggestionTargetId,
                          category: undefined,
                          customCategory: undefined,
                        })
                      ),
                    ]);

                    await Promise.all([refetch(), fetchSuggestions(), fetchListings()]);
                    showToast({ text: 'Category Merged', appearance: 'success' });
                  } catch (error) {
                    showToast('Failed to merge category. Please try again.');
                  } finally {
                    setMergingSuggestion(false);
                    setMergeSuggestionModalOpen(false);
                    setMergeSuggestionName(null);
                    setMergeSuggestionTargetId('');
                    setMergeDropdownOpen(false);
                  }
                }}
                className="allow-white-bg flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {mergingSuggestion ? 'Merging…' : 'Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteSuggestionName && (
        <DeleteDialog
          isOpen={Boolean(deleteSuggestionName)}
          onClose={() => setDeleteSuggestionName(null)}
          title="Delete Category"
          message='Are you sure you want to delete {itemName} category? Items in this category will be moved to general "Others" category.'
          tip='Consider using "Merge Into…" to reassign items to an existing category.'
          itemName={deleteSuggestionName}
          onConfirm={async () => {
            if (!deleteSuggestionName) return;
            setDeletingSuggestion(true);
            try {
              // Find all suggestions and listings with this custom category
              const suggestionMatches = suggestions.filter(
                (s) =>
                  s.customCategory?.trim() === deleteSuggestionName && s.status !== 'rejected'
              );
              const listingMatches = listings.filter(
                (l) =>
                  l.categoryId === '__others__' && l.category === `Others - ${deleteSuggestionName}`
              );

              // Update suggestions: clear customCategory and set to rejected/approved
              await Promise.all([
                ...suggestionMatches.map((m) =>
                  updateSuggestion(m.id, {
                    customCategory: '',
                    // Keep the status as-is (pending stays pending, approved stays approved)
                    status: m.status,
                  })
                ),
                // Update listings: remove the custom category label, keeping them in Others
                ...listingMatches.map((l) =>
                  updateListing(l.id, {
                    categoryId: '__others__',
                    category: undefined,
                    customCategory: undefined,
                  })
                ),
              ]);

              await Promise.all([fetchSuggestions(), fetchListings()]);
              showToast({ text: 'Category Deleted', appearance: 'success' });
              setDeleteSuggestionName(null);
            } catch (err) {
              showToast('Failed to delete category. Please try again.');
            } finally {
              setDeletingSuggestion(false);
            }
          }}
          isDeleting={deletingSuggestion}
        />
      )}
    </div>
  );
};
