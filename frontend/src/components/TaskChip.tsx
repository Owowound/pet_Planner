import type { TaskShort } from '../types';
import { colorOf, isLight } from '../utils/color';
import { barWidth, formatPercent } from '../utils/progress';
import { TagList } from './TagPill';

interface TaskChipProps {
  task: TaskShort;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

// Плашка задачи в ячейке календаря: цвет задачи, над названием её теги,
// тонкая шкала прогресса снизу и крестик удаления справа (появляется при наведении).
// На светлом цвете (жёлтый) текст и шкала становятся тёмными, чтобы читаться.
// Крестик — отдельная кнопка рядом с основной: вложить кнопку в кнопку в HTML нельзя.
export function TaskChip({ task, onOpen, onDelete }: TaskChipProps) {
  const color = colorOf(task);
  const time = new Date(task.deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`task-chip${isLight(color) ? ' is-light' : ''}`} style={{ background: color }}>
      <button
        className="task-chip-main"
        onClick={() => onOpen(task.id)}
        title={`${task.name} — ${formatPercent(task.progressPercent)}, до ${time}`}
      >
        {/* Теги над названием: с ними плашка становится выше */}
        <TagList tags={task.tags} compact limit={3} />
        <span className="task-chip-row">
          <span className="task-chip-name">
            {task.parentId && <span className="task-chip-mark">↳ </span>}
            {task.name}
          </span>
          <span className="task-chip-meta">
            {task.children.length > 0 && <span className="task-chip-children">{task.children.length} ▸ </span>}
            {task.isCompleted ? '✓' : formatPercent(task.progressPercent)}
          </span>
        </span>
      </button>
      <button
        className="task-chip-delete"
        onClick={() => onDelete(task.id)}
        aria-label={`Удалить задачу «${task.name}»`}
        title="Удалить задачу"
      >
        ×
      </button>
      <span className="task-chip-track">
        <span className="task-chip-fill" style={{ width: barWidth(task.progressPercent) }} />
      </span>
    </div>
  );
}
