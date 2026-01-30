import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarGrid = {
  month: number;
  year: number;
  days: { label: number; date: Date; isToday: boolean; isCurrentMonth: boolean }[];
};

const buildCalendar = (baseMonth: number, baseYear: number): CalendarGrid => {
  const firstDay = new Date(baseYear, baseMonth, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(baseYear, baseMonth + 1, 0).getDate();

  const today = new Date();
  const grid: CalendarGrid['days'] = [];

  // Prev month days to fill
  const prevMonthDays = startWeekday;
  const prevMonth = baseMonth === 0 ? 11 : baseMonth - 1;
  const prevYear = baseMonth === 0 ? baseYear - 1 : baseYear;
  const prevMonthTotalDays = new Date(prevYear, prevMonth + 1, 0).getDate();
  for (let i = prevMonthDays - 1; i >= 0; i -= 1) {
    const day = prevMonthTotalDays - i;
    const date = new Date(Date.UTC(prevYear, prevMonth, day, 12, 0, 0, 0));
    grid.push({
      label: day,
      date,
      isToday: date.toDateString() === today.toDateString(),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(baseYear, baseMonth, day, 12, 0, 0, 0));
    grid.push({
      label: day,
      date,
      isToday: date.toDateString() === today.toDateString(),
      isCurrentMonth: true,
    });
  }

  // Next month days to fill 42 cells (6 weeks)
  const totalCells = 42;
  let nextDay = 1;
  const nextMonth = baseMonth === 11 ? 0 : baseMonth + 1;
  const nextYear = baseMonth === 11 ? baseYear + 1 : baseYear;
  while (grid.length < totalCells) {
    const date = new Date(Date.UTC(nextYear, nextMonth, nextDay, 12, 0, 0, 0));
    grid.push({
      label: nextDay,
      date,
      isToday: date.toDateString() === today.toDateString(),
      isCurrentMonth: false,
    });
    nextDay += 1;
  }

  return { month: baseMonth, year: baseYear, days: grid };
};

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  initialMonth?: number;
  initialYear?: number;
}

export const Calendar = ({
  selectedDate,
  onSelectDate,
  initialMonth,
  initialYear,
}: CalendarProps) => {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (selectedDate) {
      return { month: selectedDate.getUTCMonth(), year: selectedDate.getUTCFullYear() };
    }
    if (initialMonth !== undefined && initialYear !== undefined) {
      return { month: initialMonth, year: initialYear };
    }
    const now = new Date();
    return { month: now.getUTCMonth(), year: now.getUTCFullYear() };
  });

  const calendar = useMemo(
    () => buildCalendar(calendarMonth.month, calendarMonth.year),
    [calendarMonth.month, calendarMonth.year]
  );

  const goMonth = (delta: number) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { month: next.getMonth(), year: next.getFullYear() };
    });
  };

  const handlePickDate = (date: Date) => {
    onSelectDate(date);
  };

  return (
    <div className="w-full min-w-[280px] sm:min-w-[320px] rounded-2xl border border-white/20 bg-[#0b0f11] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-base font-semibold text-white">
          {new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric',
          }).format(new Date(calendar.year, calendar.month, 1))}
        </div>
        <button
          type="button"
          onClick={() => goMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wide text-slate-400 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {calendar.days.map((day) => {
          const isSelected = selectedDate
            ? day.date.toDateString() === selectedDate.toDateString()
            : false;
          return (
            <button
              key={day.date.toISOString()}
              type="button"
              onClick={() => handlePickDate(day.date)}
              className={`rounded-lg px-2 py-2 transition-colors text-center cursor-pointer ${
                day.isCurrentMonth ? 'text-white' : 'text-slate-500'
              } ${
                isSelected
                  ? 'bg-white/20 border border-white/40 font-semibold'
                  : day.isToday
                    ? 'border border-white/30 bg-white/5'
                    : 'border border-transparent'
              } hover:bg-white/10`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
