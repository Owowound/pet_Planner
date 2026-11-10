import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar } from './components/Calendar';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { TagsModal, type TagPicker } from './components/TagsModal';
import { StatsPage } from './components/stats/StatsPage';
import { TaskModal } from './components/TaskModal';
import type { Tag, TaskDetails } from './types';
import { colorOf } from './utils/color';
import { addDays, formatRange, startOfDay, startOfWeek } from './utils/dates';

const WEEKS = 5;

// Открытые окна хранятся стопкой: последнее в массиве — верхнее.
// Так окно подзадачи открывается поверх окна задачи, и закрываются они по очереди.
type NewModal =
  | { kind: 'task'; taskId: string }
  | { kind: 'create'; parent?: { id: string; name: string; color: string }; initialDate?: Date }
  | { kind: 'edit'; task: TaskDetails }
  | { kind: 'delete'; taskId: string }
  // Окно тегов: без picker — справочник из шапки, с picker — выбор тегов для формы задачи.
  | { kind: 'tags'; picker?: TagPicker };

type ModalEntry = NewModal & { key: number };

// К какой задаче относится окно: нужно, чтобы после удаления закрыть окна удалённых задач.
function relatedTaskId(entry: ModalEntry): string | undefined {
  switch (entry.kind) {
    case 'task':
    case 'delete':
      return entry.taskId;
    case 'edit':
      return entry.task.id;
    case 'create':
      return entry.parent?.id;
    case 'tags':
      return undefined;
  }
}

export default function App() {
  const [start, setStart] = useState(() => startOfWeek(new Date()));
  // Экран: календарь или статистика. Модальные окна общие для обоих.
  const [view, setView] = useState<'calendar' | 'stats'>('calendar');
  const [stack, setStack] = useState<ModalEntry[]>([]);
  // Любое изменение данных увеличивает версию, и календарь с открытыми окнами перезагружаются.
  const [version, setVersion] = useState(0);
  const nextKey = useRef(1);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const push = useCallback((modal: NewModal) => {
    const key = nextKey.current++;
    setStack((current) => [...current, { ...modal, key }]);
  }, []);

  const closeTop = useCallback(() => setStack((current) => current.slice(0, -1)), []);

  // Esc закрывает верхнее окно.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeTop();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeTop]);

  const openTask = useCallback((taskId: string) => push({ kind: 'task', taskId }), [push]);
  const askDelete = useCallback((taskId: string) => push({ kind: 'delete', taskId }), [push]);
  const openEdit = useCallback((task: TaskDetails) => push({ kind: 'edit', task }), [push]);

  // Форма задачи просит окно выбора тегов. Оно открывается поверх формы,
  // по «Готово» отдаёт выбор обратно в форму и закрывается.
  const pickTags = useCallback(
    (selected: Tag[], onDone: (tags: Tag[]) => void) =>
      push({
        kind: 'tags',
        picker: {
          selected,
          onDone: (tags) => {
            onDone(tags);
            closeTop();
          },
        },
      }),
    [push, closeTop],
  );

  const openCreateSubtask = useCallback(
    (parent: TaskDetails) =>
      push({ kind: 'create', parent: { id: parent.id, name: parent.name, color: colorOf(parent) }, initialDate: startOfDay(new Date(parent.deadline)) }),
    [push],
  );

  // После удаления закрываем окно подтверждения и все окна удалённой задачи и её потомков.
  const handleDeleted = useCallback(
    (deletedIds: string[]) => {
      const deleted = new Set(deletedIds);
      setStack((current) =>
        current.filter((entry) => {
          const id = relatedTaskId(entry);
          return entry.kind !== 'delete' && !(id && deleted.has(id));
        }),
      );
      refresh();
    },
    [refresh],
  );

  const end = addDays(start, WEEKS * 7 - 1);
  const isCurrent = start.getTime() === startOfWeek(new Date()).getTime();

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar-title">
          <h1>{view === 'calendar' ? 'Календарь задач' : 'Статистика'}</h1>
          <span className="muted">{view === 'calendar' ? formatRange(start, end) : 'Прогресс и история задач'}</span>
        </div>

        <div className="toolbar-actions">
          <div className="view-switch" role="tablist" aria-label="Экран">
            <button role="tab" aria-selected={view === 'calendar'} className={view === 'calendar' ? 'is-active' : ''} onClick={() => setView('calendar')}>
              Календарь
            </button>
            <button role="tab" aria-selected={view === 'stats'} className={view === 'stats' ? 'is-active' : ''} onClick={() => setView('stats')}>
              Статистика
            </button>
          </div>
          {view === 'calendar' && (
          <div className="nav">
            <button className="button" onClick={() => setStart((s) => addDays(s, -WEEKS * 7))} aria-label="Назад">
              ‹
            </button>
            <button className="button" disabled={isCurrent} onClick={() => setStart(startOfWeek(new Date()))}>
              Сегодня
            </button>
            <button className="button" onClick={() => setStart((s) => addDays(s, WEEKS * 7))} aria-label="Вперёд">
              ›
            </button>
          </div>
          )}
          <button className="button tags-button" onClick={() => push({ kind: 'tags' })} title="Справочник тегов">
            # Теги
          </button>
          <button
            className="add-button"
            onClick={() => push({ kind: 'create' })}
            aria-label="Новая задача"
            title="Новая задача"
          >
            +
          </button>
        </div>
      </header>

      {view === 'stats' ? (
        <StatsPage version={version} onOpenTask={openTask} />
      ) : (
      <Calendar
        start={start}
        weeks={WEEKS}
        version={version}
        onOpenTask={openTask}
        onDeleteTask={askDelete}
        onCreateOnDate={(date) => push({ kind: 'create', initialDate: date })}
      />
      )}

      {stack.map((entry, index) => {
        switch (entry.kind) {
          case 'task':
            return (
              <TaskModal
                key={entry.key}
                taskId={entry.taskId}
                depth={index}
                version={version}
                onClose={closeTop}
                onOpenTask={openTask}
                onCreateSubtask={openCreateSubtask}
                onEditTask={openEdit}
                onDeleteTask={askDelete}
                onChanged={refresh}
              />
            );
          case 'create':
            return (
              <CreateTaskModal
                key={entry.key}
                depth={index}
                parent={entry.parent}
                initialDate={entry.initialDate}
                onPickTags={pickTags}
                onClose={closeTop}
                onCreated={() => {
                  closeTop();
                  refresh();
                }}
              />
            );
          case 'edit':
            return (
              <EditTaskModal
                key={entry.key}
                depth={index}
                task={entry.task}
                onPickTags={pickTags}
                onClose={closeTop}
                onSaved={() => {
                  closeTop();
                  refresh();
                }}
              />
            );
          case 'delete':
            return (
              <ConfirmDeleteModal
                key={entry.key}
                depth={index}
                taskId={entry.taskId}
                onClose={closeTop}
                onDeleted={handleDeleted}
              />
            );
          case 'tags':
            return (
              <TagsModal
                key={entry.key}
                depth={index}
                version={version}
                picker={entry.picker}
                onClose={closeTop}
                onChanged={refresh}
              />
            );
        }
      })}
    </div>
  );
}
