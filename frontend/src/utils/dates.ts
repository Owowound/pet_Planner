export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Понедельник недели, в которую попадает дата.
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7; // getDay(): 0 = воскресенье
  return addDays(day, -offset);
}

// Ключ дня в локальном времени: "2026-09-25". По нему задачи раскладываются по ячейкам.
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

// Подпись в ячейке: у первого числа месяца добавляем название месяца.
export function dayLabel(date: Date): string {
  return date.getDate() === 1 ? `1 ${MONTHS_SHORT[date.getMonth()]}` : String(date.getDate());
}

export function formatRange(from: Date, to: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const left = from.toLocaleDateString('ru-RU', options);
  const right = to.toLocaleDateString('ru-RU', { ...options, year: 'numeric' });
  return `${left} — ${right}`;
}

export function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
