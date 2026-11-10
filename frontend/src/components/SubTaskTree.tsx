import type { SubTaskInfo } from '../types';
import { formatShortDate } from '../utils/dates';
import { colorOf } from '../utils/color';
import { barWidth, formatPercent } from '../utils/progress';

interface SubTaskTreeProps {
  nodes: SubTaskInfo[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

interface Row {
  node: SubTaskInfo;
  depth: number;
}

// Превращает дерево в плоский список строк с глубиной: обход в глубину,
// чтобы каждый потомок шёл сразу под своим родителем, как на схеме.
function flatten(nodes: SubTaskInfo[], depth: number, rows: Row[]): Row[] {
  const sorted = [...nodes].sort((a, b) => a.deadline.localeCompare(b.deadline));
  for (const node of sorted) {
    rows.push({ node, depth });
    flatten(node.subTasks ?? [], depth + 1, rows);
  }
  return rows;
}

export function countDescendants(nodes: SubTaskInfo[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countDescendants(node.subTasks ?? []), 0);
}

const INDENT_PX = 22;

export function SubTaskTree({ nodes, onOpen, onDelete }: SubTaskTreeProps) {
  const rows = flatten(nodes, 0, []);

  return (
    <ul className="subtask-list">
      {rows.map(({ node, depth }) => (
        <li key={node.id} className="subtask-row" style={{ paddingLeft: depth * INDENT_PX }}>
          <button className="subtask-item" onClick={() => onOpen(node.id)}>
            {depth > 0 && <span className="subtask-branch">↳</span>}
            <span className="swatch" style={{ background: colorOf(node) }} />
            <span className="subtask-name">{node.name}</span>
            {(node.subTasks?.length ?? 0) > 0 && (
              <span className="muted subtask-count" title="Прямых подзадач">
                {node.subTasks!.length} ▸
              </span>
            )}
            <span className="muted">{formatShortDate(node.deadline)}</span>
            <span className="subtask-percent">{node.isCompleted ? '✓' : formatPercent(node.progressPercent)}</span>
            <span className="subtask-track">
              <span
                className="subtask-fill"
                style={{ width: barWidth(node.progressPercent), background: colorOf(node) }}
              />
            </span>
          </button>
          <button
            className="subtask-delete"
            onClick={() => onDelete(node.id)}
            aria-label={`Удалить подзадачу «${node.name}»`}
            title="Удалить подзадачу"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
