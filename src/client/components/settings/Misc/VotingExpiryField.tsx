import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from './Calendar';

type ExpiryMode = 'never' | 'date';

const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);

const formatExpiryLabel = (date: Date | null): string => {
  if (!date) return 'Voting never expires';
  const utcDate = new Date(date);
  const y = utcDate.getUTCFullYear();
  const m = utcDate.getUTCMonth();
  const d = utcDate.getUTCDate();
  const hours = utcDate.getUTCHours();
  const minutes = utcDate.getUTCMinutes();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m, d)));
  return `${formattedDate} (${pad(hours)}:${pad(minutes)} GMT)`;
};

interface VotingExpiryFieldProps {
  savedExpiry: Date | null;
  onSave: (expiryDate: Date | null) => void | Promise<void>;
}

export const VotingExpiryField = ({ savedExpiry, onSave }: VotingExpiryFieldProps) => {
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>(savedExpiry ? 'date' : 'never');
  const [selectedDate, setSelectedDate] = useState<Date | null>(savedExpiry);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (savedExpiry) {
      setExpiryMode('date');
      setSelectedDate(savedExpiry);
    } else {
      setExpiryMode('never');
      setSelectedDate(null);
    }
  }, [savedExpiry]);

  useEffect(() => {
    if (!calendarOpen) return undefined;

    const onClick = (e: MouseEvent) => {
      if (
        calendarRef.current &&
        buttonRef.current &&
        !calendarRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCalendarOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [calendarOpen]);

  const handleSaveExpiry = async () => {
    if (expiryMode === 'never') {
      await onSave(null);
      return;
    }

    if (!selectedDate) {
      return;
    }

    // Normalize to end-of-day UTC
    const normalized = new Date(
      Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        23,
        59,
        0,
        0
      )
    );
    await onSave(normalized);
  };

  const handlePickDate = (date: Date) => {
    setSelectedDate(date);
    setExpiryMode('date');
    setCalendarOpen(false);
  };

  const expiryLabel = formatExpiryLabel(savedExpiry);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">Voting Expiry</h3>
        <p className="text-sm text-slate-300">
          Choose 'Never Expires' to keep voting open indefinitely or set an expiry date to
          automatically close voting. (The voting will expire on selected date at 23:59 GMT+0)
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="flex items-center gap-3 text-sm sm:text-base text-slate-200 cursor-pointer select-none">
  <input
    type="radio"
    name="expiry-mode"
    value="never"
    checked={expiryMode === 'never'}
    onChange={() => {
      setExpiryMode('never');
      setSelectedDate(null);
    }}
    className="hidden"
  />
  <span
    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border 
    transition-all duration-200
    ${expiryMode === 'never' 
      ? 'border-white bg-white' 
      : 'border-slate-400'
    }`}
  >
    {expiryMode === 'never' && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#0B0B0B] rounded-full"></span>}
  </span>
  <span>Never Expires</span>
</label>

<label className="flex items-center gap-3 text-sm sm:text-base text-slate-200 cursor-pointer select-none">
  <input
    type="radio"
    name="expiry-mode"
    value="date"
    checked={expiryMode === 'date'}
    onChange={() => setExpiryMode('date')}
    className="hidden"
  />
  <span
    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border
    transition-all duration-200
    ${expiryMode === 'date' 
      ? 'border-white bg-white' 
      : 'border-slate-400'
    }`}
  >
    {expiryMode === 'date' && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#0B0B0B] rounded-full"></span>}
  </span>
  <span>Set Expiry</span>
</label>

      </div>

      {expiryMode === 'date' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="relative w-full sm:max-w-md">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setCalendarOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border border-white/70 bg-transparent px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-0 cursor-pointer"
              >
                <span>
                  {selectedDate
                    ? new Intl.DateTimeFormat('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: 'UTC',
                      }).format(selectedDate)
                    : 'Pick a date'}
                </span>
                <CalendarDays className="h-5 w-5 text-slate-300" />
              </button>

              {calendarOpen && (
                <div
                  ref={calendarRef}
                  className="absolute z-50 bottom-full mb-2 w-full left-0 right-0"
                >
                  <Calendar
                    selectedDate={selectedDate}
                    onSelectDate={handlePickDate}
                    initialMonth={selectedDate?.getMonth() ?? new Date().getMonth()}
                    initialYear={selectedDate?.getFullYear() ?? new Date().getFullYear()}
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveExpiry}
              disabled={!selectedDate}
              className="allow-white-bg inline-flex items-center justify-center rounded-md border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {expiryMode === 'date' && savedExpiry && (
        <p className="text-sm text-slate-200">Expiry set to {expiryLabel}</p>
      )}

      {expiryMode === 'never' && (
        <div className="flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleSaveExpiry}
            disabled={savedExpiry === null}
            className="allow-white-bg inline-flex items-center justify-center rounded-md border border-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            Save
          </button>
          <p className="text-sm text-gray-200">Voting will never expire</p>
        </div>
      )}
    </div>
  );
};
