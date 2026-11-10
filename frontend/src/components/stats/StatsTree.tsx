import { useState } from 'react';
import type { Tag, TaskNode } from '../../types';
import { colorOf } from '../../utils/color';
import { barWidth, formatPercent } from '../../utils/progress';
import { TagList } from '../TagPill';

interface StatsTreeProps {
  roots: TaskNode[];
  tagsById: Map<string, Tag>;
  onOpenTask: (id: string) => void;
  // Показывать процент на начало периода. В режиме «за всё время» начала нет.
  compareStart?: boolean;
}

// Теги в аналитике приходят только Id. Имя и цвет берём из справочника календаря.
export function tagsFor(ids: string[], tagsById: Map<string, Tag>): Tag[] {
  return ids.map((id) => tagsById.get(id) ?? { id, name: 'удалённый тег', color: '#94a3b8' });
}

function countNodes(nodes: TaskNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}

export function StatsTree({ roots, tagsById, onOpenTask, compareStart = false }: StatsTreeProps) {
  if (roots.length === 0) {
    return <div className="muted stats-empty">Задач пока нет. Как только в календаре появятся задачи, здесь будет их дерево.</div>;
  }

  return (
    <>
      <div className="muted stats-caption">
        Корневых задач: {roots.length}, всего в деревьях: {countNodes(roots)}. Процент родителя — среднее по детям.
      </div>
      <ul className="stats-tree">
        {roots.map((node) => (
          <TreeNodeRow key={node.taskId} node={node} depth={0} tagsById={tagsById} onOpenTask={onOpenTask} compareStart={compareStart} />
        ))}
      </ul>
    </>
  );
}

interface RowProps {
  node: TaskNode;
  depth: number;
  tagsById: Map<string, Tag>;
  onOpenTask: (id: string) => void;
  compareStart: boolean;
}

function TreeNodeRow({ node, depth, tagsById, onOpenTask, compareStart }: RowProps) {
  const [open, setOpen] = useState(true);
  const color = colorOf(node);
  const hasChildren = node.children.length > 0;
  const start = node.startTreePercent;
  // Задачи на начало периода не было — создана внутри периода.
  const isNew = compareStart && (start === null || start === undefined);
  const showStart =
    compareStart && start !== null && start !== undefined && Math.round(start) !== Math.round(node.treePercent);

  return (
    <li className="stats-node-item">
      <div className="stats-node" style={{ marginLeft: depth * 22 }}>
        <button
          className="stats-toggle"
          onClick={() => setOpen((o) => !o)}
          disabled={!hasChildren}
          aria-label={open ? 'Свернуть подзадачи' : 'Развернуть подзадачи'}
          aria-expanded={hasChildren ? open : undefined}
        >
          {hasChildren ? (open ? '▾' : '▸') : ''}
        </button>

        <button className="stats-node-main" onClick={() => onOpenTask(node.taskId)} title="Открыть задачу">
          <span className="swatch" style={{ background: color }} />
          <span className="stats-node-name">{node.name}</span>
          {node.isCompleted && <span className="stats-badge stats-badge-done">выполнена</span>}
          <TagList tags={tagsFor(node.tagIds, tagsById)} limit={3} />
        </button>

        <span className="stats-node-steps muted" title={hasChildren ? 'Собственный прогресс родителя' : undefined}>
          {node.progress}/{node.goal}
        </span>

        <span className="stats-bar" title={showStart ? `Было ${formatPercent(start!)}, стало ${formatPercent(node.treePercent)}` : undefined}>
          {showStart && <i className="stats-bar-start" style={{ width: barWidth(start!), background: color }} />}
          <i className={`stats-bar-end${showStart ? ' is-compared' : ''}`} style={{ width: barWidth(node.treePercent), background: color }} />
        </span>

        <span className="stats-node-pct">
          {showStart && <span className="muted">{formatPercent(start!)} → </span>}
          {isNew && <span className="muted" title="Задача создана в этом периоде">— → </span>}
          <b>{formatPercent(node.treePercent)}</b>
        </span>
      </div>

      {hasChildren && open && (
        <ul className="stats-tree">
          {node.children.map((child) => (
            <TreeNodeRow key={child.taskId} node={child} depth={depth + 1} tagsById={tagsById} onOpenTask={onOpenTask} compareStart={compareStart} />
          ))}
        </ul>
      )}
    </li>
  );
}
