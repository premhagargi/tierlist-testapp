import { useState } from 'react';
import { LoadingSpinner } from '../../LoadingSpinner';
import { Tier } from '../../../hooks/useTiers';
import { Ban, ChevronDown, ChevronUp, Pencil, Trash } from 'lucide-react';
import { DeleteDialog } from '../../DeleteDialog';

interface TiersListProps {
  tiers: Tier[];
  loading: boolean;
  deletingId?: string | null;
  onAdd?: () => void;
  onEdit: (tier: Tier) => void;
  onDelete: (id: string) => Promise<void>;
  onMoveUp: (id: string, order: number) => Promise<void>;
  onMoveDown: (id: string, order: number) => Promise<void>;
}

export const TiersList = ({
  tiers,
  loading,
  deletingId,
  onAdd,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TiersListProps) => {
  const [confirmTier, setConfirmTier] = useState<Tier | null>(null);

  const handleConfirmDelete = async () => {
    if (!confirmTier) return;
    try {
      await onDelete(confirmTier.id);
    } finally {
      setConfirmTier(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size={40} centered />;
  }

  if (tiers.length === 0) {
    return (
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-900/30 text-sky-200">
          <Ban size={26} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-100">No tiers yet</p>
          <p className="text-sm text-slate-400">Create your first tier to get started.</p>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="rounded-full border border-sky-500/70 px-3 py-1.5 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-900/40"
          >
            Add Tier
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 space-y-3">
        {tiers
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((tier, index) => (
            <div
              key={tier.id}
              className="flex items-center gap-5 rounded-xl border border-[#5D6263] bg-black p-1 shadow-sm transition-all duration-200 hover:-translate-y-[1px] "
            >
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 border border-slate-700 ring-1 ring-inset ring-white/5"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${tier.colour} 65%, rgba(255,255,255,0.25))`,
                  backgroundColor: tier.colour,
                }}
              />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 truncate sm:break-words">
                  {tier.name}
                </p>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onMoveUp(tier.id, index)}
                  disabled={index === 0}
                  className="p-1.5 text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Move up"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={() => onMoveDown(tier.id, index)}
                  disabled={index === tiers.length - 1}
                  className="p-1.5 text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Move down"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              <button
                onClick={() => onEdit(tier)}
                className="p-1.5 text-slate-300 hover:text-sky-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
                title="Edit tier"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() => setConfirmTier(tier)}
                disabled={deletingId === tier.id}
                className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-wait flex-shrink-0"
                title="Delete tier"
              >
                {deletingId === tier.id ? <LoadingSpinner size={16} /> : <Trash size={18} />}
              </button>
            </div>
          ))}
      </div>

      {confirmTier && (
        <DeleteDialog
          isOpen={Boolean(confirmTier)}
          onClose={() => setConfirmTier(null)}
          title="Delete Tier"
          message="Are you sure you want to delete {itemName} tier? Item ranking will be re-calculated. This action cannot be undone."
          itemName={confirmTier.name}
          onConfirm={handleConfirmDelete}
          isDeleting={deletingId === confirmTier.id}
        />
      )}
    </>
  );
};
