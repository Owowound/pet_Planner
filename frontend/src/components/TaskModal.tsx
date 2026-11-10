import { useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import type { TaskDetails } from '../types';
import { formatDeadline } from '../utils/dates';
import { colorOf } from '../utils/color';
import { barWidth, formatPercent } from '../utils/progress';
import { Modal } from './Modal';
import { SubTaskTree, countDescendants } from './SubTaskTree';
import { TagList } from './TagPill';

interface TaskModalProps {
  taskId: string;
  depth: number;
  version: number;
  onClose: () => void;
  onOpenTask: (id: string) => void;
  onCreateSubtask: (parent: TaskDetails) => void;
  onEditTask: (task: TaskDetails) => void;
  onDeleteTask: (id: string) => void;
  onChanged: () => void;
}

export function TaskModal({
  taskId,
  depth,
  version,
  onClose,
  onOpenTask,
  onCreateSubtask,
  onEditTask,
  onDeleteTask,
  onChanged,
}: TaskModalProps) {
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [customDelta, setCustomDelta] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .getTask(taskId)
      .then((result) => {
        if (cancelled) return;
        setTask(result);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404 && e.message === 'Ошибка 404') {
          // Пустой 404 означает, что в сервисе нет самого маршрута, а не задачи.
          setLoadError('Сервис не знает маршрут GET /api/tasks/{id}. Его нужно добавить в бэкенд.');
        } else {
          setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить задачу');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [taskId, version]);

  async function changeProgress(delta: number) {
    if (!task || delta === 0) return;

    setPending(true);
    setActionError(null);
    try {
      await api.addProgress(task.id, delta);
      setCustomDelta('');
      onChanged();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Не удалось изменить прогресс');
    } finally {
      setPending(false);
    }
  }

  function submitCustomDelta() {
    const delta = Number(customDelta);
    if (!Number.isInteger(delta) || delta === 0) {
      setActionError('Введите целое число, не равное нулю (можно отрицательное)');
      return;
    }
    if (task && task.progress + delta < 0) {
      setActionError(`Прогресс не может стать меньше нуля (сейчас ${task.progress})`);
      return;
    }
    void changeProgress(delta);
  }

  if (!task) {
    return (
      <Modal depth={depth} title={loadError ? 'Ошибка' : 'Загрузка…'} onClose={onClose}>
        {loadError ? <div className="banner banner-error">{loadError}</div> : <div className="muted">Загружаем задачу…</div>}
      </Modal>
    );
  }

  const hasSubTasks = task.subTasks.length > 0;
  const totalDescendants = countDescendants(task.subTasks);

  return (
    <Modal
      depth={depth}
      onClose={onClose}
      title={
        <>
          <span className="swatch" style={{ background: colorOf(task) }} />
          {task.name}
        </>
      }
    >
      <div className="task-actions">
        {task.parentId && (
          <button className="link-button" onClick={() => onOpenTask(task.parentId!)}>
            ↑ Открыть родительскую задачу
          </button>
        )}
        <div className="task-actions-right">
          <button className="button button-small" onClick={() => onEditTask(task)}>
            ✎ Изменить
          </button>
          <button className="button button-small button-danger-outline" onClick={() => onDeleteTask(task.id)}>
            Удалить задачу
          </button>
        </div>
      </div>

      <dl className="details">
        <dt>Теги</dt>
        <dd>{task.tags && task.tags.length > 0 ? <TagList tags={task.tags} /> : <span className="muted">Без тегов</span>}</dd>
        <dt>Дедлайн</dt>
        <dd>{formatDeadline(task.deadline)}</dd>
        <dt>Описание</dt>
        <dd className={task.description ? 'description' : 'muted'}>{task.description || 'Без описания'}</dd>
      </dl>

      <section className="progress-section">
        <div className="progress-head">
          <span>Прогресс</span>
          <span className="progress-numbers">
            {task.progress} / {task.goal} · <b>{formatPercent(task.progressPercent)}</b>
            {task.isCompleted && <span className="done-badge">выполнено</span>}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: barWidth(task.progressPercent), background: colorOf(task) }}
          />
        </div>

        <div className="progress-controls">
          <button className="button" disabled={pending || task.progress <= 0} onClick={() => void changeProgress(-1)}>
            −1
          </button>
          <button className="button" disabled={pending || task.isCompleted} onClick={() => void changeProgress(1)}>
            +1
          </button>
          <input
            className="input input-small"
            type="number"
            step={1}
            placeholder="±N"
            value={customDelta}
            onChange={(e) => setCustomDelta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCustomDelta();
            }}
          />
          <button className="button" disabled={pending || customDelta === ''} onClick={submitCustomDelta}>
            Добавить
          </button>
        </div>

        {hasSubTasks && (
          <div className="muted child-progress">
            Средний прогресс подзадач: <b>{formatPercent(task.childProgressPercent)}</b>
          </div>
        )}

        {actionError && <div className="banner banner-error">{actionError}</div>}
      </section>

      <section className="subtasks">
        <div className="subtasks-head">
          <span>
            Подзадачи
            {hasSubTasks && (
              <span className="muted subtasks-total">
                {' '}
                {task.subTasks.length}
                {totalDescendants > task.subTasks.length && ` · всего ${totalDescendants}`}
              </span>
            )}
          </span>
          <button
            className="icon-button icon-button-accent"
            onClick={() => onCreateSubtask(task)}
            aria-label="Добавить подзадачу"
            title="Добавить подзадачу"
          >
            +
          </button>
        </div>

        {hasSubTasks ? (
          <SubTaskTree nodes={task.subTasks} onOpen={onOpenTask} onDelete={onDeleteTask} />
        ) : (
          <div className="muted">Подзадач пока нет. Нажмите «+», чтобы добавить.</div>
        )}
      </section>
    </Modal>
  );
}
