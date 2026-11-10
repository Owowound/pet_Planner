import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { TaskShort } from '../types';
import { WEEKDAYS, addDays, dateKey, dayLabel, isSameDay, startOfDay } from '../utils/dates';
import { TaskChip } from './TaskChip';

interface CalendarProps {
  start: Date; // понедельник первой недели
  weeks: number;
  version: number; // меняется после каждого изменения данных — повод перезагрузить задачи
  onOpenTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCreateOnDate: (date: Date) => void;
}

export function Calendar({ start, weeks, version, onOpenTask, onDeleteTask, onCreateOnDate }: CalendarProps) {
  const [tasks, setTasks] = useState<TaskShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(
    () => Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i)),
    [start, weeks],
  );

  useEffect(() => {
    let cancelled = false;

    // Сервер фильтрует по датам в UTC, а ячейки считаются в местном времени.
    // Берём по дню с запасом с обеих сторон, чтобы не потерять задачи на границах суток.
    const from = dateKey(addDays(days[0], -1));
    const to = dateKey(addDays(days[days.length - 1], 1));

    setLoading(true);
    api
      .getTasks(from, to)
      .then((result) => {
        if (cancelled) return;
        setTasks(result);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days, version]);

  // Раскладываем задачи по дням в местном времени, внутри дня — по времени дедлайна.
  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskShort[]>();
    const sorted = [...tasks].sort((a, b) => a.deadline.localeCompare(b.deadline));
    for (const task of sorted) {
      const key = dateKey(new Date(task.deadline));
      const list = map.get(key);
      if (list) list.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  const today = startOfDay(new Date());

  return (
    <section className="calendar">
      {error && (
        <div className="banner banner-error">
          {error}
        </div>
      )}

      <div className="calendar-grid calendar-weekdays">
        {WEEKDAYS.map((name) => (
          <div key={name} className="weekday">
            {name}
          </div>
        ))}
      </div>

      <div className={`calendar-grid calendar-days${loading ? ' is-loading' : ''}`}>
        {days.map((day) => {
          const dayTasks = tasksByDay.get(dateKey(day)) ?? [];
          const isToday = isSameDay(day, today);
          const isPast = day < today;

          return (
            <div
              key={dateKey(day)}
              className={`day${isToday ? ' is-today' : ''}${isPast ? ' is-past' : ''}`}
            >
              <div className="day-header">
                <span className="day-number">{dayLabel(day)}</span>
                <button
                  className="day-add"
                  onClick={() => onCreateOnDate(day)}
                  aria-label="Добавить задачу на этот день"
                  title="Добавить задачу на этот день"
                >
                  +
                </button>
              </div>
              <div className="day-tasks">
                {dayTasks.map((task) => (
                  <TaskChip key={task.id} task={task} onOpen={onOpenTask} onDelete={onDeleteTask} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
