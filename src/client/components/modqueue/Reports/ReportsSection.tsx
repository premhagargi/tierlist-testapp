import { useMemo, useState, useEffect } from 'react';
import { showToast } from '@devvit/web/client';
import { DeleteDialog } from '../../DeleteDialog';
import { useReports } from '../../../hooks/useReports';
import { useCategories } from '../../../hooks/useCategories';
import { useListings } from '../../../hooks/useListings';
import { ListingFormDialog } from '../Listings/ListingFormDialog';
import { ReportList } from './ReportList';
import { Report, Listing } from '../../../../shared/types/api';

interface ReportsSectionProps {
  appId: string;
}

export const ReportsSection = ({ appId }: ReportsSectionProps) => {
  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    updateReport,
    refetch: refetchReports,
  } = useReports(appId);
  const {
    categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories(appId);
  const { listings, loading: listingsLoading, fetchListings, updateListing } = useListings(appId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingReport, setDeletingReport] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loading = reportsLoading || categoriesLoading || listingsLoading;
  const error = reportsError;

  const pendingReports = useMemo(
    () => reports.filter((r) => !r.status || r.status === 'action-needed'),
    [reports]
  );
  const actionNeededCount = pendingReports.length;

  // Extract unique "Others - ..." categories from listings
  const otherCategories = useMemo(() => {
    const uniqueOthers = new Set<string>();
    listings.forEach((listing) => {
      if (listing.category && listing.category.startsWith('Others - ')) {
        uniqueOthers.add(listing.category);
      }
    });
    return Array.from(uniqueOthers).sort();
  }, [listings]);

  // Load categories and listings on mount for instant availability
  useEffect(() => {
    refetchCategories();
    fetchListings();
  }, [refetchCategories, fetchListings]);

  const handleIgnore = async (report: Report) => {
    try {
      await updateReport(report.id, 'ignore');
      showToast({ text: 'Report Ignored', appearance: 'success' });
    } catch {
      showToast('Failed to ignore report. Please try again.');
    }
  };

  const handleRemove = async (report: Report) => {
    setDeletingReport(report);
  };

  const openEdit = (report: Report) => {
    // Find the listing from the already-loaded listings array (no API call needed)
    const listing = listings.find((l) => l.id === report.listingId);
    if (!listing) {
      console.error('Listing not found for edit');
      return;
    }

    setEditingListing(listing);
    setEditingReport(report);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: {
    name: string;
    imageUrl: string;
    categoryId: string;
    category?: string | undefined;
    customCategory?: string | undefined;
    url?: string | undefined;
  }) => {
    if (!editingListing || !editingReport) return;
    setEditSubmitting(true);

    try {
      // Use updateListing hook function which updates local state automatically
      const updated = await updateListing(editingListing.id, values);

      if (!updated) {
        showToast('Failed to update item. Please try again.');
        setEditSubmitting(false);
        return;
      }

      // Update the report entry with the new listing data AND report context
      try {
        await updateReport(editingReport.id, 'edit', {
          issue: editingReport.issue,
          comment: editingReport.comment || '',
        });

        // Refetch reports to get the latest listing data including URL
        await refetchReports();
      } catch (reportErr) {
        console.error('Failed to update report, but listing was updated:', reportErr);
        // Don't fail the entire operation if only report update fails
      }

      // Clear editing state first, then close form to prevent flash of old values
      setEditingListing(null);
      setEditingReport(null);
      setIsEditOpen(false);
      showToast({ text: 'Changes Saved', appearance: 'success' });
    } catch (err) {
      showToast('Failed to update item. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left px-2 sm:px-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-lg font-semibold text-white leading-tight flex items-center gap-2">
              Reports
              {actionNeededCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full border border-white/20 px-2 py-0.5 text-xs font-semibold text-white/80">
                  {actionNeededCount}
                </span>
              )}
            </h2>
            <p className="text-sm text-[--color-text-subtle] max-w-2xl">
              See items your community has reported and decide what action to take.
            </p>
          </div>
        </div>
      </div>

      <ReportList
        reports={pendingReports}
        loading={loading}
        error={error}
        onRemove={handleRemove}
        onEdit={openEdit}
        onIgnore={handleIgnore}
        listings={listings.map((l) => ({
          id: l.id,
          categoryId: l.categoryId,
          category: l.category,
          customCategory: l.category?.startsWith('Others - ')
            ? l.category.replace(/^Others - /, '')
            : undefined,
        }))}
        categories={categories}
      />

      {/* Delete Dialog for removing a report/listing */}
      <DeleteDialog
        isOpen={!!deletingReport}
        onClose={() => setDeletingReport(null)}
        title="Delete Item"
        message="Are you sure you want to delete {itemName}? This action cannot be undone."
        itemName={deletingReport?.listingName || 'Item'}
        isDeleting={isDeleting}
        onConfirm={async () => {
          if (!deletingReport) return;
          setIsDeleting(true);
          try {
            await updateReport(deletingReport.id, 'remove');
            showToast({ text: 'Item Deleted', appearance: 'success' });
          } catch {
            showToast('Failed to delete item. Please try again.');
          }
          setIsDeleting(false);
          setDeletingReport(null);
        }}
      />

      <ListingFormDialog
        isOpen={isEditOpen}
        isEditing
        appId={appId}
        categories={categories}
        otherCategories={otherCategories}
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
        submitting={editSubmitting}
        onClose={() => {
          setIsEditOpen(false);
          setEditingListing(null);
          setEditingReport(null);
        }}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};
