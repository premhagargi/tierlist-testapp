type SuggestionHandlingMode = 'auto-approve' | 'admin-review';

interface SuggestionHandlingFieldProps {
  mode: SuggestionHandlingMode;
  onChange: (mode: SuggestionHandlingMode) => void;
  onSave: () => void | Promise<void>;
}

export const SuggestionHandlingField = ({
  mode,
  onChange,
  onSave,
}: SuggestionHandlingFieldProps) => {
  const isAuto = mode === 'auto-approve';

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

      <div className="flex flex-row items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="allow-white-bg inline-flex items-center justify-center rounded-md border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition cursor-pointer"
        >
          Save
        </button>
        <p className="text-sm text-gray-200">
          Current mode: {isAuto ? 'Auto-Approve' : 'Admin review'}
        </p>
      </div>
    </div>
  );
};
