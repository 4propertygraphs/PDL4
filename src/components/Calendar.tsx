import { useMemo } from 'react';
import './calendar.css';

type Props = {
  year: number;
  month: number; // 0-11
  highlightedDates?: string[]; // yyyy-mm-dd
  onDayClick?: (date: string) => void;
};

const pad = (n: number) => String(n).padStart(2, '0');

export default function Calendar({ year, month, highlightedDates = [], onDayClick }: Props) {
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // Sunday = 0
    const totalDays = lastDay.getDate();
    const list: (number | null)[] = [];

    for (let i = 0; i < startOffset; i++) list.push(null);
    for (let d = 1; d <= totalDays; d++) list.push(d);
    return list;
  }, [year, month]);

  const isHighlighted = (day: number | null) => {
    if (!day) return false;
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    return highlightedDates.includes(key);
  };

  const handleClick = (day: number | null) => {
    if (!day) return;
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    onDayClick?.(key);
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="calendar-header-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-cell ${day ? 'active' : 'empty'} ${isHighlighted(day) ? 'highlight' : ''}`}
            onClick={() => handleClick(day)}
          >
            {day && <span>{day}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
