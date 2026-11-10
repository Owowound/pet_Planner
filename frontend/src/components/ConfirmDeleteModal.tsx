import { useEffect, useState } from 'react';
import { api } from '../api';
import type { SubTaskInfo, TaskDetails } from '../types';
import { Modal } from './Modal';
import { countDescendants } from './SubTaskTree';

interface ConfirmDeleteModalProps {
  depth: number;
  taskId: string;
  onClose: () => void;
  // Передаёт id удалённой задачи и всех её потомков, чтобы закрыть их открытые окна.
  onDeleted: (deletedIds: string[]) => void;
}

function collectIds(nodes: SubTaskInfo[], into: string[]): string[] {
  for (const node of nodes) {
    into.push(node.id);
    collectIds(node.subTasks ?? [], into);
  }
  return into;
}

function pluralSubtasks(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} подзадача`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} подзадачи`;
  return `${n} подзадач`;
}

export function ConfirmDeleteModal({ depth, taskId, onClose, onDeleted }: ConfirmDeleteModalProps) {
  // Загружаем задачу, чтобы показать название и точно посчитать всех потомков,
  // даже если удаление начато с плашки календаря, где известны только прямые дети.
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getTask(taskId)
      .then((result) => {
        if (!cancelled) setTask(result);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await api.deleteTask(taskId);
      onDeleted([taskId, ...(task ? collectIds(task.subTasks, []) : [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить задачу');
      setPending(false);
    }
  }

  const descendants = task ? countDescendants(task.subTasks) : 0;

  return (
    <Modal depth={depth} title="Удалить задачу?" onClose={onClose} size="small">
      {task ? (
        <p className="confirm-text">
          Задача «<b>{task.name}</b>» будет удалена без возможности восстановления.
        </p>
      ) : (
        !error && <p className="muted">Загружаем задачу…</p>
      )}

      {descendants > 0 && (
        <div className="banner banner-warning">
          Вместе с ней будут удалены все подзадачи, включая вложенные: <b>{pluralSubtasks(descendants)}</b>.
        </div>
      )}

      {error && <div className="banner banner-error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="button button-ghost" onClick={onClose} autoFocus>
          Отмена
        </button>
        <button type="button" className="button button-danger" disabled={pending || (!task && !error)} onClick={confirm}>
          {pending ? 'Удаляем…' : 'Удалить'}
        </button>
      </div>
    </Modal>
  );
}
