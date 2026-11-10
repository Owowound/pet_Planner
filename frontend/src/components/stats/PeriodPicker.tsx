import type { StatsPeriod } from '../../types';
import { addDays, dateKey, formatRange, startOfDay } from '../../utils/dates';

export type PeriodPreset = 'all' | 'week' | 'month' | 'custom';

export interface PeriodState {
  preset: PeriodPreset;
  // Свой период: дни в локальном времени, "2026-09-01". Конец включительно — как видит пользователь.
  customFrom: string;
  customTo: string;
}

export interface ResolvedPeriod {
  period: StatsPeriod;
  isAllTime: boolean;
  label: string;
  error: string | null;
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'week', label: '7 дней' },
  { key: 'month', label: '30 дней' },
  { key: 'all', label: 'Всё время' },
  { key: 'custom', label: 'Свой период' },
];

export function defaultPeriodState(): PeriodState {
  const today = startOfDay(new Date());
  return { preset: 'all', customFrom: dateKey(addDays(today, -6)), customTo: dateKey(today) };
}

// "2026-09-01" → локальная полночь этого дня.
function parseDay(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

// Дни пользователя → полуоткрытый интервал [начало первого дня, начало дня после последнего) в UTC.
// Так бэкенду не нужно знать часовой пояс, а «по 29 сентября» включает весь 29-й день.
function rangeOf(firstDay: Date, lastDay: Date): StatsPeriod {
  return { from: firstDay.toISOString(), to: addDays(lastDay, 1).toISOString() };
}

export function resolvePeriod(state: PeriodState): ResolvedPeriod {
  const today = startOfDay(new Date());

  switch (state.preset) {
    case 'all':
      return { period: { from: null, to: null }, isAllTime: true, label: 'За всё время', error: null };
    case 'week':
    case 'month': {
      const first = addDays(today, state.preset === 'week' ? -6 : -29);
      return { period: rangeOf(first, today), isAllTime: false, label: formatRange(first, today), error: null };
    }
    case 'custom': {
      const first = parseDay(state.customFrom);
      const last = parseDay(state.customTo);
      if (!first || !last) {
        return { period: { from: null, to: null }, isAllTime: false, label: '', error: 'Укажи обе даты периода.' };
      }
      if (first > last) {
        return { period: { from: null, to: null }, isAllTime: false, label: '', error: 'Начало периода позже конца.' };
      }
      return { period: rangeOf(first, last), isAllTime: false, label: formatRange(first, last), error: null };
    }
  }
}

interface PeriodPickerProps {
  value: PeriodState;
  onChange: (value: PeriodState) => void;
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const today = dateKey(new Date());

  return (
    <div className="stats-period">
      <div className="stats-chips" role="group" aria-label="Период статистики">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            className={`stats-chip${value.preset === p.key ? ' is-active' : ''}`}
            onClick={() => onChange({ ...value, preset: p.key })}
            aria-pressed={value.preset === p.key}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value.preset === 'custom' && (
        <div className="stats-period-custom">
          <label>
            <span className="muted">с</span>
            <input
              type="date"
              className="input"
              value={value.customFrom}
              max={value.customTo || today}
              onChange={(e) => onChange({ ...value, customFrom: e.target.value })}
            />
          </label>
          <label>
            <span className="muted">по</span>
            <input
              type="date"
              className="input"
              value={value.customTo}
              min={value.customFrom}
              max={today}
              onChange={(e) => onChange({ ...value, customTo: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
