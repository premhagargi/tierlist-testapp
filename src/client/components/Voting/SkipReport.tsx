interface SkipReportProps {
  onSkip: () => void;
  onToggleReport: () => void;
}

export const SkipReport = ({ onSkip, onToggleReport }: SkipReportProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="w-full rounded-md hover:cursor-pointer border border-[#FF6464] px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 hover:pointer transition"
          onClick={onSkip}
        >
          Skip / Next
        </button>
        <button
          type="button"
          onClick={onToggleReport}
          className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-sm text-xs text-white hover:bg-[#2A3236] transition hover:cursor-pointer self-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-octagon-alert-icon lucide-octagon-alert"
          >
            <path d="M12 16h.01" />
            <path d="M12 8v4" />
            <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" />
          </svg>
          Report Item
        </button>
      </div>
    </div>
  );
};
