import { LoadingSpinner } from '../../LoadingSpinner';
import { Category } from '../../../../shared/types/api';
import { Ban, GitMerge, Grid2X2, Pencil, Trash } from 'lucide-react';

interface CategoriesListProps {
  categories: Category[];
  loading: boolean;
  deletingId?: string | null;
  onEdit: (category: Category) => void;
  onRequestDelete: (category: Category) => void;
  onRequestMerge: (category: Category) => void;
}

export const CategoriesList = ({
  categories,
  loading,
  deletingId,
  onEdit,
  onRequestDelete,
  onRequestMerge,
}: CategoriesListProps) => {
  if (loading) {
    return <LoadingSpinner size={40} centered />;
  }

  if (categories.length === 0) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-900/30 text-sky-200">
          <Ban size={26} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-100">No categories yet</p>
          <p className="text-sm text-slate-400">Create your first category to organize items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 shadow-sm overflow-hidden">
      <div className="divide-y divide-[#5D6263] bg-transparent">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 px-2 py-2 transition-colors hover:bg-white/5"
          >
            <div className="text-slate-200">
              <Grid2X2 size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-slate-100 truncate sm:truncate-none" title={category.name}>
                {category.name.length > 25 ? category.name.slice(0, 25) + '...' : category.name}
              </p>
            </div>

            <button
              onClick={() => onEdit(category)}
              className="p-1.5 text-slate-300 hover:text-sky-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
              title="Edit category"
            >
              <Pencil size={18} />
            </button>

            <button
              onClick={() => onRequestMerge(category)}
              className="p-1.5 text-slate-300 hover:text-emerald-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
              title="Merge category"
            >
              <GitMerge className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={() => onRequestDelete(category)}
              disabled={deletingId === category.id}
              className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              title="Delete category"
            >
              {deletingId === category.id ? <LoadingSpinner size={16} /> : <Trash size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
