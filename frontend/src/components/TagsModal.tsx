import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { api } from '../api';
import type { Tag } from '../types';
import { colorOf, randomPreset } from '../utils/color';
import { ColorField } from './ColorPicker';
import { Modal } from './Modal';

// Окно тегов работает в двух режимах:
// - справочник (кнопка в шапке): создать, изменить имя и цвет, удалить;
// - выбор (из формы задачи): то же самое плюс отметить теги и нажать «Готово».
export interface TagPicker {
  selected: Tag[];
  onDone: (tags: Tag[]) => void;
}

interface TagsModalProps {
  depth: number;
  version: number;
  picker?: TagPicker;
  onClose: () => void;
  // Теги изменились: календарь и открытые окна нужно перезагрузить.
  onChanged: () => void;
}

// Так же нормализует имя бэкенд: без пробелов по краям и в нижнем регистре.
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function TagsModal({ depth, version, picker, onClose, onChanged }: TagsModalProps) {
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [query, setQuery] = useState('');
  // Цвет для нового тега: случайный пресет, чтобы быстрое создание по Enter не требовало выбора.
  const [newColor, setNewColor] = useState(randomPreset);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(picker?.selected.map((t) => t.id)));
  const [editing, setEditing] = useState<{ id: string; name: string; color: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .getTags()
      .then((result) => {
        if (!cancelled) setTags(result);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [version, reload]);

  const normalizedQuery = normalize(query);

  const visible = useMemo(() => {
    const list = [...(tags ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    return normalizedQuery ? list.filter((t) => t.name.toLowerCase().includes(normalizedQuery)) : list;
  }, [tags, normalizedQuery]);

  const exactMatch = tags?.find((t) => t.name.toLowerCase() === normalizedQuery);
  const canCreate = normalizedQuery.length > 0 && !exactMatch;
  const selectedCount = tags ? tags.filter((t) => selected.has(t.id)).length : selected.size;

  // Общая обёртка для запросов: блокирует кнопки, показывает ошибку, перечитывает список.
  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      setReload((r) => r + 1);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
    } finally {
      setPending(false);
    }
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function create() {
    if (!canCreate) return;
    void run(async () => {
      const { id } = await api.createTag(normalizedQuery, newColor);
      setQuery('');
      setNewColor(randomPreset());
      // В режиме выбора новый тег сразу отмечаем: скорее всего, его для этого и создавали.
      if (picker) setSelected((current) => new Set(current).add(id));
    });
  }

  function onQueryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (canCreate) create();
    else if (exactMatch && picker) {
      toggle(exactMatch.id);
      setQuery('');
    }
  }

  function saveEdit() {
    if (!editing) return;
    const name = normalize(editing.name);
    const current = tags?.find((t) => t.id === editing.id);
    if (!name) return setError('Имя тега не может быть пустым');
    if (current && current.name === name && colorOf(current) === editing.color) return setEditing(null);
    void run(async () => {
      await api.updateTag(editing.id, name, editing.color);
      setEditing(null);
    });
  }

  function remove(id: string) {
    void run(async () => {
      await api.deleteTag(id);
      setConfirmDelete(null);
      setSelected((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    });
  }

  function done() {
    if (!picker || !tags) return;
    // Отдаём актуальные объекты: имя могли переименовать, а тег — удалить.
    picker.onDone(tags.filter((t) => selected.has(t.id)));
  }

  return (
    <Modal depth={depth} title={picker ? 'Выбор тегов' : 'Теги'} onClose={onClose} size="small">
      <div className="tag-search">
        <ColorField compact value={newColor} onChange={setNewColor} />
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onQueryKeyDown}
          placeholder="Найти или создать тег"
          maxLength={50}
          autoFocus
        />
        <button className="button button-primary" disabled={!canCreate || pending} onClick={create}>
          Создать
        </button>
      </div>

      {canCreate && (
        <button className="tag-create-hint link-button" disabled={pending} onClick={create}>
          + Создать тег «{normalizedQuery}»
        </button>
      )}

      {error && <div className="banner banner-error">{error}</div>}

      {tags === null && !error && <div className="muted">Загружаем теги…</div>}

      {tags !== null && tags.length === 0 && (
        <div className="muted tag-empty">Тегов пока нет. Введите имя и нажмите «Создать».</div>
      )}

      {tags !== null && tags.length > 0 && visible.length === 0 && (
        <div className="muted tag-empty">Ничего не найдено.</div>
      )}

      <ul className="tag-rows">
        {visible.map((tag) => {
          const isSelected = selected.has(tag.id);
          const isEditing = editing?.id === tag.id;
          const isConfirming = confirmDelete === tag.id;

          return (
            <li key={tag.id} className={`tag-row${isSelected ? ' is-selected' : ''}`}>
              {isEditing ? (
                <span className="tag-edit">
                  <ColorField compact value={editing.color} onChange={(color) => setEditing({ ...editing, color })} />
                  <input
                    className="input tag-rename"
                    value={editing.name}
                    maxLength={50}
                    autoFocus
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') {
                        // Esc отменяет изменение, а не закрывает всё окно.
                        e.stopPropagation();
                        setEditing(null);
                      }
                    }}
                  />
                </span>
              ) : (
                <button
                  className="tag-row-main"
                  disabled={!picker}
                  onClick={() => toggle(tag.id)}
                  aria-pressed={picker ? isSelected : undefined}
                >
                  {picker && <span className="tag-check">{isSelected ? '✓' : ''}</span>}
                  <span className="tag-dot" style={{ background: colorOf(tag) }} />
                  <span className="tag-row-name">{tag.name}</span>
                </button>
              )}

              {isConfirming ? (
                <span className="tag-row-confirm">
                  <span className="muted">Удалить у всех задач?</span>
                  <button className="button button-small button-danger" disabled={pending} onClick={() => remove(tag.id)}>
                    Удалить
                  </button>
                  <button className="button button-small" onClick={() => setConfirmDelete(null)}>
                    Нет
                  </button>
                </span>
              ) : isEditing ? (
                <span className="tag-row-actions">
                  <button className="button button-small button-primary" disabled={pending} onClick={saveEdit}>
                    Сохранить
                  </button>
                  <button className="button button-small" onClick={() => setEditing(null)}>
                    Отмена
                  </button>
                </span>
              ) : (
                <span className="tag-row-actions">
                  <button
                    className="icon-button tag-action"
                    onClick={() => {
                      setConfirmDelete(null);
                      setEditing({ id: tag.id, name: tag.name, color: colorOf(tag) });
                    }}
                    aria-label={`Изменить тег «${tag.name}»`}
                    title="Изменить имя и цвет"
                  >
                    ✎
                  </button>
                  <button
                    className="icon-button tag-action"
                    onClick={() => {
                      setEditing(null);
                      setConfirmDelete(tag.id);
                    }}
                    aria-label={`Удалить тег «${tag.name}»`}
                    title="Удалить"
                  >
                    ×
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="form-actions tag-footer">
        {picker ? (
          <>
            <span className="muted tag-footer-count">Выбрано: {selectedCount}</span>
            <button className="button button-ghost" onClick={onClose}>
              Отмена
            </button>
            <button className="button button-primary" disabled={tags === null} onClick={done}>
              Готово
            </button>
          </>
        ) : (
          <button className="button" onClick={onClose}>
            Закрыть
          </button>
        )}
      </div>
    </Modal>
  );
}
