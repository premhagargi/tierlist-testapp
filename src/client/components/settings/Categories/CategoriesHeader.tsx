import { Layers, Plus } from 'lucide-react';

interface CategoriesHeaderProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export const CategoriesHeader = ({
  value,
  onChange,
  onSubmit,
  disabled,
}: CategoriesHeaderProps) => (
  <div className="space-y-3">
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-white">Manage Categories</h2>
      </div>
      <p className="text-sm text-gray-300">
        Add, remove, or merge categories. You can also add or merge categories suggested by
        contributors.
      </p>
    </div>

    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <input
        type="text"
        maxLength={25}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add new category..."
        className="flex-1 rounded-lg border border-[#5D6263] bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#648EFC] focus:outline-none focus:ring-0 cursor-text"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="allow-white-bg inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
      >
        <Plus size={18} />
        ADD
      </button>
    </div>
  </div>
);
