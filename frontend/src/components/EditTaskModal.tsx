import { api } from '../api';
import type { Tag, TaskDetails } from '../types';
import { colorOf } from '../utils/color';
import { dateKey } from '../utils/dates';
import { TaskFormModal } from './TaskFormModal';

interface EditTaskModalProps {
  depth: number;
  task: TaskDetails;
  onClose: () => void;
  onSaved: () => void;
  onPickTags: (selected: Tag[], onDone: (tags: Tag[]) => void) => void;
}

function timeKey(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function EditTaskModal({ depth, task, onClose, onSaved, onPickTags }: EditTaskModalProps) {
  // Дедлайн хранится в UTC, а в форме показываем местные дату и время.
  const deadline = new Date(task.deadline);

  return (
    <TaskFormModal
      depth={depth}
      title="Изменить задачу"
      initial={{
        name: task.name,
        description: task.description,
        date: dateKey(deadline),
        time: timeKey(deadline),
        goal: String(task.goal),
        color: colorOf(task),
      }}
      initialTags={task.tags ?? []}
      onPickTags={onPickTags}
      submitLabel="Сохранить"
      pendingLabel="Сохраняем…"
      onClose={onClose}
      warning={(values) => {
        const goal = Number(values.goal);
        return Number.isInteger(goal) && goal >= 1 && goal < task.progress
          ? `Цель меньше текущего прогресса (${task.progress}): прогресс уменьшится до ${goal}.`
          : null;
      }}
      onSubmit={async (fields) => {
        await api.updateTask(task.id, fields);
        onSaved();
      }}
    />
  );
}
