import { useEffect, useState } from 'react';
import { Dialog } from '../../Dialog';

interface CategoriesFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  submitting: boolean;
}

export const CategoriesFormDialog = ({
  isOpen,
  isEditing,
  initialName = '',
  onClose,
  onSubmit,
  submitting,
}: CategoriesFormDialogProps) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [initialName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(name);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Category' : 'Add Category'}>
      <p className="text-sm text-slate-300">
        Define a category name to organize your tier list items.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Category Name</span>
            <span className="text-slate-400">{name.length}/25</span>
          </div>
          <input
            type="text"
            value={name}
            maxLength={25}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-white/70 bg-transparent px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-0 cursor-text"
            placeholder="e.g. Movies, Games, Books"
            required
          />
        </div>

        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/70 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="allow-white-bg flex-1 rounded-full border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:cursor-wait disabled:opacity-70 cursor-pointer"
          >
            {submitting ? 'Saving…' : isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
