import { useMemo, useState } from 'react';

type SuggestionHandlingMode = 'auto-approve' | 'admin-review';

interface Listing {
  id: string;
  appId: string;
  name: string | undefined;
  imageUrl: string;
  categoryId: string;
  category?: string | undefined;
  url?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

interface SuggestionHandlingFieldProps {
  mode: SuggestionHandlingMode;
  onChange: (mode: SuggestionHandlingMode) => void;
  onSave: (featuredItem: LaunchItem | null) => void | Promise<void>;
  allItems: LaunchItem[];              // list to search from (id, name)
  fullListings: Listing[];             // full listing data for finding complete item
  featuredItem: LaunchItem | null;     // currently featured
  onFeaturedChange: (item: LaunchItem | null) => void;
  isSaving?: boolean;                  // show spinner when saving
}

interface LaunchItem {
  id: string;
  name: string;
}

export const SuggestionHandlingField = ({
  mode,
  onChange,
  onSave,
  allItems,
  fullListings,
  featuredItem,
  onFeaturedChange,
  isSaving = false,
}: SuggestionHandlingFieldProps) => {
  const isAuto = mode === 'auto-approve';
  // 🔍 Search state
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    return allItems
      .filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 6);
  }, [query, allItems]);

  const handleSelectItem = (item: LaunchItem) => {
    setQuery(item.name);
    setShowDropdown(false);
  };
  
  const handleSave = () => {
    // Find the item that matches the current query
    const selectedItem = allItems.find(item => item.name === query) || null;
    if (selectedItem) {
      onFeaturedChange(selectedItem);
      onSave(selectedItem);
    } else {
      // If no valid selection, just save with null to clear
      onSave(null);
    }
  };
  
  // Check if a valid item is selected
  const hasValidSelection = allItems.some(item => item.name === query);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">Item Suggestion Handling</h3>
        <p className="text-sm text-slate-300">
          Choose how items suggested by community members are added to the tier list.
        </p>
      </div>

      <div className="flex-col flex items-start gap-2 sm:gap-4">
        <label className="flex items-center gap-3 text-sm sm:text-base text-slate-200 cursor-pointer select-none">
          <input
            type="radio"
            name="suggestion-handling"
            value="auto-approve"
            checked={isAuto}
            onChange={() => onChange('auto-approve')}
            className="hidden"
          />
          <span
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border 
    transition-all duration-200
    ${isAuto ? 'border-white bg-white' : 'border-slate-400'}`}
          >
            {isAuto && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#0B0B0B] rounded-full" />}
          </span>
          <span>
            <span className="font-semibold">Auto-Approve:</span> Add user suggestions instantly
          </span>
        </label>

        <label className="flex items-center gap-3 text-sm sm:text-base text-slate-200 cursor-pointer select-none">
          <input
            type="radio"
            name="suggestion-handling"
            value="admin-review"
            checked={!isAuto}
            onChange={() => onChange('admin-review')}
            className="hidden"
          />
          <span
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border 
    transition-all duration-200
    ${!isAuto ? 'border-white bg-white' : 'border-slate-400'}`}
          >
            {!isAuto && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#0B0B0B] rounded-full" />}
          </span>
          <span>
            <span className="font-semibold">Admin review:</span> Approve suggestions before adding
          </span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">
            Launch Screen Customization
          </h3>
          <p className="text-sm text-slate-300">
            Feature one item on the launch screen to focus attention and invite members to vote.
          </p>
        </div>

        <div className="flex items-start gap-3 max-w-2xl">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by Item Name"
            className="w-full rounded-md border border-slate-500 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-white"
          />

          {showDropdown && filteredItems.length > 0 && (
            <div className="absolute z-20 mb-2 w-full rounded-md border border-slate-600 bg-[#111] shadow-lg overflow-hidden bottom-full">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white hover:text-black transition"
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SAVE BUTTON MOVED HERE */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasValidSelection}
          className="allow-white-bg h-[42px] whitespace-nowrap inline-flex items-center justify-center rounded-md border border-white px-5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Save'
          )}
        </button>
        </div>


        {/* Helper Text */}
        <div className="text-sm text-slate-300 space-y-1">
          {!featuredItem && (
            <p>No featured item selected. Displaying general launch screen.</p>
          )}
          {featuredItem && (
            <p>
              <span className="font-semibold text-white">{featuredItem.name}</span>{' '}
              is currently featured on the launch screen.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
