import type { Tag } from '../types';
import { colorOf, textColorOn } from '../utils/color';

interface TagPillProps {
  tag: Tag;
  // Маленькая версия для плашки в календаре.
  compact?: boolean;
  // Если передан, у тега появляется крестик «убрать».
  onRemove?: (tag: Tag) => void;
}

export function TagPill({ tag, compact, onRemove }: TagPillProps) {
  return (
    <span
      className={`tag-pill${compact ? ' tag-pill-compact' : ''}`}
      style={{ background: colorOf(tag), color: textColorOn(colorOf(tag)) }}
      title={tag.name}
    >
      <span className="tag-pill-name">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          className="tag-pill-remove"
          onClick={() => onRemove(tag)}
          aria-label={`Убрать тег «${tag.name}»`}
        >
          ×
        </button>
      )}
    </span>
  );
}

interface TagListProps {
  tags: Tag[] | undefined;
  compact?: boolean;
  // Сколько тегов показать, остальные свернуть в «+N».
  limit?: number;
}

export function TagList({ tags, compact, limit }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));
  const shown = limit ? sorted.slice(0, limit) : sorted;
  const hidden = sorted.length - shown.length;

  return (
    <span className={`tag-list${compact ? ' tag-list-compact' : ''}`}>
      {shown.map((tag) => (
        <TagPill key={tag.id} tag={tag} compact={compact} />
      ))}
      {hidden > 0 && (
        <span className="tag-more" title={sorted.slice(shown.length).map((t) => t.name).join(', ')}>
          +{hidden}
        </span>
      )}
    </span>
  );
}
