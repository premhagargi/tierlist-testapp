import { useState, useEffect, useRef, FormEvent } from 'react';

const reportReasons = [
  { value: 'Spam', label: 'Spam' },
  { value: 'Duplicate', label: 'Duplicate' },
  { value: 'Inappropriate or irrelevant item', label: 'Inappropriate or irrelevant item' },
  { value: 'Broken or invalid link', label: 'Broken or invalid link' },
  { value: 'Reason not listed', label: 'Reason not listed' },
];

const NOTES_LIMIT = 200;

interface ReportFormDialogProps {
  isOpen: boolean;
  reportIssue: string;
  reportNotes: string;
  isReporting: boolean;
  userId: string | null;
  onClose: () => void;
  onReportIssueChange: (value: string) => void;
  onReportNotesChange: (value: string) => void;
  onSubmitReport: () => void;
}

export const ReportFormDialog = ({
  isOpen,
  reportIssue,
  reportNotes,
  isReporting,
  userId,
  onClose,
  onReportIssueChange,
  onReportNotesChange,
  onSubmitReport,
}: ReportFormDialogProps) => {
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);
  const reasonMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!reasonMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (reasonMenuRef.current && !reasonMenuRef.current.contains(event.target as Node)) {
        setReasonMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [reasonMenuOpen]);

  useEffect(() => {
    if (!isOpen) {
      setReasonMenuOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitReport();
  };

  const notesCount = `${reportNotes.length}/${NOTES_LIMIT}`;
  const canSubmitReport = Boolean(reportIssue && userId);

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center px-3 sm:px-4 py-6 bg-black/70 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#0b0f11] px-4 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] mt-4">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 h-9 w-9 rounded-full text-slate-100 hover:text-white hover:border-white transition-colors"
          aria-label="Close report dialog"
        >
          ✕
        </button>

        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold text-white">Report Item</h3>
          <p className="text-sm text-slate-300">
            Help us maintain quality by reporting problematic items.
          </p>
        </div>

        {!userId && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 text-red-100 px-3 py-2 text-sm">
            Login required to submit a report
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1" ref={reasonMenuRef}>
            <label className="block text-xs text-white" htmlFor="report-reason">
              Select a reason<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                id="report-reason"
                aria-haspopup="listbox"
                aria-expanded={reasonMenuOpen}
                onClick={() => setReasonMenuOpen((previous) => !previous)}
                className="inline-flex items-center justify-between w-full rounded-lg border border-white/30 bg-[#0b0f11] px-3 py-3 text-sm font-medium text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2A3236] cursor-pointer"
              >
                <span
                  className={`truncate text-left ${reportIssue ? 'text-white' : 'text-gray-500'}`}
                >
                  {reportIssue || 'Choose a reason'}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${reasonMenuOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {reasonMenuOpen && (
                <div
                  className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-[#0b0f11] rounded-lg border border-white/10 shadow-xl animate-in fade-in-0 zoom-in-95 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                  role="listbox"
                >
                  {reportReasons.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      role="option"
                      aria-selected={reportIssue === reason.value}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors bg-[#0b0f11] hover:bg-white/5 ${
                        reportIssue === reason.value ? 'text-white bg-white/5' : 'text-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-[#2A3236]`}
                      onClick={() => {
                        onReportIssueChange(reason.value);
                        setReasonMenuOpen(false);
                      }}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-white">
              <span>Additional notes</span>
              <span className="text-slate-300">{notesCount}</span>
            </div>
            <textarea
              id="report-notes"
              value={reportNotes}
              onChange={(event) => onReportNotesChange(event.target.value.slice(0, NOTES_LIMIT))}
              maxLength={NOTES_LIMIT}
              placeholder="Provide additional details if needed"
              className="w-full rounded-lg border border-white/30 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-0 min-h-[96px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-full border border-white/40 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReporting || !canSubmitReport}
              className={`px-5 py-2.5 text-sm font-semibold rounded-full transition ${
                canSubmitReport && !isReporting
                  ? 'bg-[#ff7f7f] text-black hover:bg-[#ff6a6a]'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/20'
              }`}
            >
              {isReporting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
