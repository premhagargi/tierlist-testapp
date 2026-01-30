import { useEffect, useState, useMemo } from 'react';
import { showToast } from '@devvit/web/client';
import { CopyPlus, Plus, ShieldCheck } from 'lucide-react';
import { SuggestionsSection } from '../components/modqueue/Suggestions/SuggestionsSection';
import { ListingsSection } from '../components/modqueue/Listings/ListingsSection';
import { ReportsSection } from '../components/modqueue/Reports/ReportsSection';
import { PageLoader } from '../components/PageLoader';

export type ModTab = 'suggestions' | 'reports' | 'listings';

interface ModQueueTabsProps {
  activeTab: ModTab;
  onChange: (tab: ModTab) => void;
}

const ModQueueTabs = ({ activeTab, onChange }: ModQueueTabsProps) => {
  const tabs: { id: ModTab; label: string }[] = [
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'reports', label: 'Reports' },
    { id: 'listings', label: 'Listings' },
  ];

  return (
    <nav
      className="flex items-center gap-3 sm:gap-5 text-sm font-medium w-full sm:w-auto -mb-[1px]"
      aria-label="Tabs"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative pb-3 sm:pb-4 px-2 text-white transition-colors cursor-pointer text-left"
        >
          <span>{tab.label}</span>
          <span
            className={`absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-200 ${
              activeTab === tab.id ? 'bg-[#648EFC] scale-x-100' : 'bg-transparent scale-x-0'
            }`}
          />
        </button>
      ))}
    </nav>
  );
};

interface ModQueuePageProps {
  displayName: string | null;
  appId: string;
  addSuggestionRequestId: number;
  canModerate: boolean;
  checkingModerator: boolean;
}

// Update the import path below if the file is named differently or located elsewhere
import { useCategories } from '../hooks/useCategories';
import { useListings } from '../hooks/useListings';
import { useSuggestions } from '../hooks/useSuggestions';
import { ListingFormDialog } from '../components/modqueue/Listings/ListingFormDialog';
import { BulkImportDialog } from '../components/modqueue/Listings/BulkImportDialog';
import { Listing } from '../../shared/types/api';

export const ModQueuePage = (props: ModQueuePageProps) => {
  const [activeTab, setActiveTab] = useState<ModTab>('suggestions');
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { appId, addSuggestionRequestId, canModerate, checkingModerator } = props;
  const { categories, refetch: refetchCategories } = useCategories(appId);
  const {
    listings,
    loading: listingsLoading,
    error: listingsError,
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
  } = useListings(appId);
  const { suggestions } = useSuggestions(appId);

  useEffect(() => {
    if (addSuggestionRequestId > 0) {
      setActiveTab('suggestions');
    }
  }, [addSuggestionRequestId]);

  useEffect(() => {
    if (activeTab === 'listings') {
      fetchListings();
    }
  }, [activeTab, fetchListings]);

  const otherCategories = useMemo(() => {
    const listingCategories = listings
      .filter(
        (l: Listing) =>
          l.categoryId === '__others__' && l.category && l.category.startsWith('Others - ')
      )
      .map((l: Listing) => l.category as string);

    const suggestionCategories = suggestions
      .filter((s) => s.customCategory && s.status !== 'rejected')
      .map((s) => `Others - ${s.customCategory!.trim()}`);

    return Array.from(new Set([...listingCategories, ...suggestionCategories])).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [listings, suggestions]);

  // For listing form dialog - only show categories that have listings
  const listingOnlyOtherCategories = useMemo(() => {
    const listingCategories = listings
      .filter(
        (l: Listing) =>
          l.categoryId === '__others__' && l.category && l.category.startsWith('Others - ')
      )
      .map((l: Listing) => l.category as string);

    return Array.from(new Set(listingCategories)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [listings]);

  useEffect(() => {
    if (showForm) {
      refetchCategories();
      fetchListings();
    }
  }, [showForm, refetchCategories, fetchListings]);

  if (checkingModerator) {
    return <PageLoader />;
  }

  if (!canModerate) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E1113] transition-colors duration-200 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-bold text-white">Access restricted</h1>
          <p className="text-sm text-[--color-text-subtle]">
            Only added moderators can review suggestions, reports, and listings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E1113]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-6">
        <div className="border-b border-[#343536] px-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div className="pb-3 flex items-center gap-2">
              <ShieldCheck size={18} />
              <h1 className="text-xl font-semibold text-white">Moderation</h1>
            </div>

            <div className="flex items-center gap-3 justify-start sm:justify-end -mb-[1px]">
              <ModQueueTabs activeTab={activeTab} onChange={setActiveTab} />

              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 cursor-pointer whitespace-nowrap mb-2"
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulkImport(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 cursor-pointer whitespace-nowrap mb-2"
                title="Bulk Import"
              >
                <CopyPlus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {activeTab === 'suggestions' && (
            <SuggestionsSection
              appId={appId}
              addRequestId={addSuggestionRequestId}
              otherCategories={otherCategories}
            />
          )}
          {activeTab === 'reports' && <ReportsSection appId={appId} />}
          {activeTab === 'listings' && (
            <ListingsSection
              appId={appId}
              listings={listings}
              categories={categories}
              loading={listingsLoading}
              error={listingsError}
              onEdit={(listing) => {
                setEditingListing(listing);
                setShowForm(true);
              }}
              onDelete={async (id) => {
                await deleteListing(id);
              }}
            />
          )}
          <ListingFormDialog
            isOpen={showForm}
            isEditing={Boolean(editingListing)}
            appId={appId}
            categories={categories}
            otherCategories={listingOnlyOtherCategories}
            initialValues={
              editingListing
                ? {
                    name: editingListing.name || '',
                    imageUrl: editingListing.imageUrl,
                    categoryId: editingListing.categoryId,
                    customCategory: editingListing.category?.startsWith('Others - ')
                      ? editingListing.category.replace(/^Others - /, '')
                      : undefined,
                    url: editingListing.url || '',
                  }
                : undefined
            }
            submitting={submitting}
            onClose={() => {
              setShowForm(false);
              setEditingListing(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              try {
                if (editingListing) {
                  const updated = await updateListing(editingListing.id, values);
                  if (updated) {
                    setEditingListing(null);
                    setShowForm(false);
                    showToast({ text: 'Changes Saved', appearance: 'success' });
                  } else {
                    showToast('Failed to update listing');
                  }
                } else {
                  const created = await createListing(values);
                  if (created) {
                    setEditingListing(null);
                    setShowForm(false);
                    showToast({ text: 'Item Added', appearance: 'success' });
                  } else {
                    showToast('Failed to create listing');
                  }
                }
              } finally {
                setSubmitting(false);
              }
            }}
          />
          <BulkImportDialog
            isOpen={showBulkImport}
            appId={appId}
            categories={categories}
            onClose={() => {
              setShowBulkImport(false);
            }}
            onSuccess={() => {
              fetchListings();
            }}
          />
        </div>
      </div>
    </div>
  );
};
