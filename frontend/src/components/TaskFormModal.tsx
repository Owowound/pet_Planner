import { useState, type FormEvent, type ReactNode } from 'react';
import type { Tag, TaskFields } from '../types';
import { ColorField } from './ColorPicker';
import { Modal } from './Modal';
import { TagPill } from './TagPill';

// Значения полей формы в том виде, в каком их видит пользователь (местное время).
export interface TaskFormValues {
  name: string;
  description: string;
  date: string; // "2026-09-25"
  time: string; // "18:00"
  goal: string;
  color: string; // "#rrggbb"
}

interface TaskFormModalProps {
  depth: number;
  title: string;
  hint?: ReactNode;
  initial: TaskFormValues;
  initialTags: Tag[];
  // Открывает окно выбора тегов поверх формы; выбранное вернётся через onDone.
  onPickTags: (selected: Tag[], onDone: (tags: Tag[]) => void) => void;
  submitLabel: string;
  pendingLabel: string;
  // Отдаёт готовые поля для API. Если бросит ошибку, она покажется в форме.
  onSubmit: (fields: TaskFields) => Promise<void>;
  onClose: () => void;
  // Дополнительная проверка, например «цель меньше текущего прогресса».
  warning?: (values: TaskFormValues) => string | null;
}

// Общая форма для создания и изменения задачи: одинаковые поля, проверки и перевод даты в UTC.
export function TaskFormModal({
  depth,
  title,
  hint,
  initial,
  initialTags,
  onPickTags,
  submitLabel,
  pendingLabel,
  onSubmit,
  onClose,
  warning,
}: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>(initial);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TaskFormValues>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const name = values.name.trim();
    const goal = Number(values.goal);
    // Дата и время вводятся в местном времени, на сервер уходят в UTC (toISOString добавляет Z).
    const deadline = new Date(`${values.date}T${values.time || '00:00'}`);

    if (!name) return setError('Введите название');
    if (!Number.isInteger(goal) || goal < 1) return setError('Цель — целое число от 1');
    if (Number.isNaN(deadline.getTime())) return setError('Укажите корректную дату');

    setPending(true);
    try {
      await onSubmit({
        name,
        description: values.description.trim(),
        deadline: deadline.toISOString(),
        goal,
        color: values.color,
        tags: tags.map((t) => t.id),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить задачу');
    } finally {
      setPending(false);
    }
  }

  const warningText = warning?.(values) ?? null;

  return (
    <Modal depth={depth} title={title} onClose={onClose}>
      {hint && <div className="muted form-hint">{hint}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <span>Теги</span>
          <div className="tag-field">
            {[...tags]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((tag) => (
                <TagPill key={tag.id} tag={tag} onRemove={(t) => setTags((cur) => cur.filter((x) => x.id !== t.id))} />
              ))}
            <button
              type="button"
              className="button button-small tag-field-add"
              onClick={() => onPickTags(tags, (picked) => setTags(picked))}
            >
              {tags.length > 0 ? '✎ Изменить' : '+ Добавить тег'}
            </button>
          </div>
        </div>

        <label className="field">
          <span>Название</span>
          <input
            className="input"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Например, прочитать книгу"
            autoFocus
            maxLength={200}
          />
        </label>

        <label className="field">
          <span>Описание</span>
          <textarea
            className="input"
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Необязательно"
          />
        </label>

        <div className="field">
          <span>Цвет</span>
          <ColorField value={values.color} onChange={(color) => set('color', color)} />
        </div>

        <div className="field-row">
          <label className="field">
            <span>Дата</span>
            <input className="input" type="date" value={values.date} onChange={(e) => set('date', e.target.value)} required />
          </label>
          <label className="field">
            <span>Время</span>
            <input className="input" type="time" value={values.time} onChange={(e) => set('time', e.target.value)} />
          </label>
          <label className="field">
            <span>Цель</span>
            <input
              className="input"
              type="number"
              min={1}
              step={1}
              value={values.goal}
              onChange={(e) => set('goal', e.target.value)}
              title="Сколько шагов нужно сделать: страниц, задач, часов"
            />
          </label>
        </div>

        {warningText && <div className="banner banner-warning">{warningText}</div>}
        {error && <div className="banner banner-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="button button-ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="button button-primary" disabled={pending}>
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
