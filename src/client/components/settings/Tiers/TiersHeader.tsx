import { Plus } from 'lucide-react';

interface TiersHeaderProps {
  onAdd: () => void;
  disabled: boolean;
}

export const TiersHeader = ({ onAdd, disabled }: TiersHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-white">Manage Tiers</h2>
      <p className="text-sm text-gray-300">
        Votes are tied to tiers. Editing, reordering, or adding tiers does not trigger
        recalculation. Deleting a tier removes its associated votes and triggers recalculation and
        tier reassignment.
      </p>
    </div>

    <button
      onClick={onAdd}
      disabled={disabled}
      className="inline-flex items-center bg-black gap-2 self-start rounded-full border  border-slate-700 px-4 py-2 cursor-pointer text-sm font-medium text-white focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Plus size={18} />
    </button>
  </div>
);
