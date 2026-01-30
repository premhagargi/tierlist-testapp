import { useCallback, useEffect, useRef, useState } from 'react';
import { showToast } from '@devvit/web/client';
import { useCategories } from '../../../hooks/useCategories';
import { useSuggestions } from '../../../hooks/useSuggestions';
import { useListings } from '../../../hooks/useListings';
import { Suggestion } from '../../../../shared/types/api';

import { SuggestionList } from './SuggestionList';
import { SuggestionFormDialog, SuggestionFormValues } from './SuggestionFormDialog';

interface SuggestionsSectionProps {
  appId: string;
  addRequestId?: number;
  otherCategories: string[]; // Add this prop
}

export const SuggestionsSection = ({
  appId,
  addRequestId,
  otherCategories,
}: SuggestionsSectionProps) => {

  const [showForm, setShowForm] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    createCategory,
    refetch: refetchCategories,
  } = useCategories(appId);

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    pendingCount,
    createSuggestion,
    updateSuggestion,
    setSuggestionStatus,
  } = useSuggestions(appId);

  const { fetchListings } = useListings(appId);
  const { createListing } = useListings(appId);

  const loading = categoriesLoading || suggestionsLoading;
  const error = categoriesError || suggestionsError;
  const lastRequestIdRef = useRef<number | undefined>(undefined);

  const openCreate = useCallback(() => {
    setEditingSuggestion(null);
    setShowForm(true);
  }, []);

  const openEdit = (suggestion: Suggestion) => {
    refetchCategories();
    setEditingSuggestion(suggestion);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSuggestion(null);
  };

  useEffect(() => {
    if (showForm) {
      refetchCategories();
      fetchListings();
    }
  }, [showForm, refetchCategories, fetchListings]);

  const handleSubmit = async (values: SuggestionFormValues) => {
    setSubmitting(true);
    let categoryId = values.categoryId;
    if (!editingSuggestion && values.customCategory) {
      const created = await createCategory(values.customCategory);
      if (!created) {
        setSubmitting(false);
        showToast('Failed to create category.');
        return;
      }
      categoryId = created.id;
    }
    if (editingSuggestion) {
      const updated = await updateSuggestion(editingSuggestion.id, {
        ...values,
        categoryId,
        url: values.url ?? '',
        notes: values.notes ?? '',
        customCategory: values.customCategory ?? '',
      });
      if (updated) {
        closeForm();
        showToast({ text: 'Changes Saved', appearance: 'success' });
      } else {
        showToast('Failed to update suggestion.');
      }
    } else {
      const created = await createSuggestion({
        ...values,
        categoryId,
        url: values.url ?? '',
        notes: values.notes ?? '',
        customCategory: values.customCategory ?? '',
      });
      if (created) {
        closeForm();
        showToast({ text: 'Suggestion Submitted', appearance: 'success' });
      } else {
        showToast('Failed to submit suggestion.');
      }
    }
    setSubmitting(false);
  };

  const handleApprove = async (id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    try {
      await setSuggestionStatus(id, 'approved');
      if (suggestion) {
        let categoryDisplay = undefined;
        let finalCategoryId = suggestion.categoryId;

        // Handle custom categories created from suggestions
        if (suggestion.customCategory) {
          // When a custom category was created, the categoryId points to the real category
          // But listings need categoryId='__others__' and category='Others - X' for proper display
          finalCategoryId = '__others__';
          categoryDisplay = `Others - ${suggestion.customCategory}`;
        } else if (suggestion.categoryId === '__others__') {
          // Fallback for edge case where categoryId is __others__ but no customCategory
          categoryDisplay = 'Others';
        }

        await createListing({
          name: suggestion.name,
          imageUrl: suggestion.imageUrl,
          categoryId: finalCategoryId,
          category: categoryDisplay,
          url: suggestion.url,
        });
      }
      showToast({ text: 'Item Approved', appearance: 'success' });
    } catch {
      showToast('Failed to approve item.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await setSuggestionStatus(id, 'rejected');
      showToast({ text: 'Item Rejected', appearance: 'success' });
    } catch {
      showToast('Failed to reject item.');
    }
  };

  useEffect(() => {
    if (!addRequestId) return;
    if (addRequestId === lastRequestIdRef.current) return;

    lastRequestIdRef.current = addRequestId;
    openCreate();
  }, [addRequestId, openCreate]);

  return (
    <div className="space-y-4 text-left px-2 sm:px-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-lg font-semibold text-white leading-tight flex items-center gap-2">
              Manage Suggestions
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full border border-white/20 px-2 py-0.5 text-xs font-semibold text-white/80">
                  {pendingCount}
                </span>
              )}
            </h2>
            <p className="text-sm text-[--color-text-subtle] max-w-2xl">
              Review and approve items suggested by your community.
            </p>
          </div>
        </div>
      </div>

      <SuggestionList
        suggestions={suggestions}
        categories={categories}
        activeTab="pending"
        loading={loading}
        error={error}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={openEdit}
      />

      <SuggestionFormDialog
        isOpen={showForm}
        isEditing={Boolean(editingSuggestion)}
        categories={categories}
        otherCategories={otherCategories}
        initialValues={
          editingSuggestion
            ? {
                name: editingSuggestion.name,
                imageUrl: editingSuggestion.imageUrl,
                categoryId: editingSuggestion.categoryId,
                url: editingSuggestion.url,
                notes: editingSuggestion.notes,
                customCategory: editingSuggestion.customCategory,
              }
            : undefined
        }
        submitting={submitting}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
