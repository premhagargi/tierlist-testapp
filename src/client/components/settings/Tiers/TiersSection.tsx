import { useState } from 'react';
import { showToast } from '@devvit/web/client';
import { Tier, useTiers } from '../../../hooks/useTiers';
import { TiersHeader } from './TiersHeader';
import { TiersFormDialog } from './TiersFormDialog';
import { TiersList } from './TiersList';

interface TiersSectionProps {
  appId: string;
}

export const TiersSection = ({ appId }: TiersSectionProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { tiers, loading, error, createTier, updateTier, deleteTier, reorderTiers, refetch } =
    useTiers(appId);

  const openCreate = () => {
    setEditingTier(null);
    setShowForm(true);
  };

  const openEdit = (tier: Tier) => {
    setEditingTier(tier);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTier(null);
  };

  const handleSubmit = async (name: string, colour: string) => {
    if (!name.trim() || !colour) {
      showToast('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const ok = editingTier
      ? await updateTier(editingTier.id, { name: name.trim(), colour })
      : await createTier(name.trim(), colour);
    setSubmitting(false);

    if (ok) {
      closeForm();
      showToast({ text: editingTier ? 'Changes Saved' : 'Tier Added', appearance: 'success' });
    } else {
      showToast(editingTier ? 'Failed to update tier. Please try again.' : 'Failed to add tier. Please try again.');
    }
  };

  const handleDelete = async (tierId: string) => {
    setDeletingId(tierId);
    const ok = await deleteTier(tierId);
    if (!ok) {
      showToast('Failed to delete tier. Please try again.');
    } else {
      await refetch();
      showToast({ text: 'Tier Deleted', appearance: 'success' });
    }
    setDeletingId(null);
  };

  const handleMoveUp = async (tierId: string, order: number) => {
    if (order > 0) await reorderTiers(tierId, order - 1);
  };

  const handleMoveDown = async (tierId: string, order: number) => {
    if (order < tiers.length - 1) await reorderTiers(tierId, order + 1);
  };

  return (
    <>
      <div className="space-y-5 px-2 sm:px-2 border-0">
        <TiersHeader onAdd={openCreate} disabled={submitting || (showForm && !editingTier)} />

        {error && (
          <div className="p-3 rounded-lg border border-red-900/60 bg-red-900/30 text-red-100">
            {error}
          </div>
        )}

        <TiersList
          tiers={tiers}
          loading={loading}
          deletingId={deletingId}
          onAdd={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      </div>

      <TiersFormDialog
        isOpen={showForm}
        isEditing={Boolean(editingTier)}
        initialName={editingTier?.name ?? ''}
        initialColour={editingTier?.colour ?? ''}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitting={submitting}
      />


    </>
  );
};
