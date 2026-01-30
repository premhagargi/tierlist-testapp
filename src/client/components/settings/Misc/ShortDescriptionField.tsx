interface ShortDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void | Promise<void>;
}

export const ShortDescriptionField = ({ value, onChange, onSave }: ShortDescriptionFieldProps) => (
  <div className="space-y-2">
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-white">Short Description</h3>
      <p className="text-sm text-gray-300">
        The short description appears on the launch screen once voting has concluded. It appears
        in the place of the call-to-action.
      </p>
    </div>
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
        <span>100 characters limit</span>
        <span>{value.length}/100</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          value={value}
          maxLength={100}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-white/70 bg-transparent px-4 py-3 text-base text-white placeholder:text-gray-400 focus:border-white focus:outline-none focus:ring-0 cursor-text"
          placeholder="Enter short description"
        />
        <button
          type="button"
          onClick={onSave}
          className="allow-white-bg inline-flex items-center justify-center rounded-md border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:cursor-wait disabled:opacity-70 cursor-pointer"
        >
          Save
        </button>
      </div>
    </div>
  </div>
);

