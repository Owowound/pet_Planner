import { api } from '../api';
import type { Tag } from '../types';
import { DEFAULT_COLOR } from '../utils/color';
import { addDays, dateKey, startOfDay } from '../utils/dates';
import { TaskFormModal } from './TaskFormModal';

interface CreateTaskModalProps {
  depth: number;
  // Цвет родителя подставляется в подзадачу по умолчанию, его можно поменять в форме.
  parent?: { id: string; name: string; color: string };
  initialDate?: Date;
  onClose: () => void;
  onCreated: () => void;
  onPickTags: (selected: Tag[], onDone: (tags: Tag[]) => void) => void;
}

export function CreateTaskModal({ depth, parent, initialDate, onClose, onCreated, onPickTags }: CreateTaskModalProps) {
  const defaultDate = initialDate ?? addDays(startOfDay(new Date()), 1);

  return (
    <TaskFormModal
      depth={depth}
      title={parent ? 'Новая подзадача' : 'Новая задача'}
      hint={parent && <>Будет подзадачей для «{parent.name}»</>}
      initial={{ name: '', description: '', date: dateKey(defaultDate), time: '18:00', goal: '10', color: parent?.color ?? DEFAULT_COLOR }}
      initialTags={[]}
      onPickTags={onPickTags}
      submitLabel="Создать"
      pendingLabel="Создаём…"
      onClose={onClose}
      onSubmit={async (fields) => {
        const created = await api.createTask(fields);

        if (parent) {
          // Задача создаётся и привязывается двумя запросами. Если упал второй, задача уже существует.
          try {
            await api.addSubTask(parent.id, created.id);
          } catch (e) {
            const message = e instanceof Error ? e.message : 'неизвестная ошибка';
            throw new Error(`Задача создана, но не привязана к родителю: ${message}`);
          }
        }

        onCreated();
      }}
    />
  );
}
