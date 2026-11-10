import type { ReactNode } from 'react';

interface ModalProps {
  // Глубина в стопке окон: каждое следующее окно чуть смещено, чтобы было видно, что оно поверх.
  depth: number;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: 'normal' | 'small';
}

export function Modal({ depth, title, onClose, children, size = 'normal' }: ModalProps) {
  const offset = Math.min(depth, 6) * 18;

  return (
    <div className="modal-layer" style={{ zIndex: 100 + depth }}>
      <div className="modal-backdrop" onClick={onClose} />
      <div
        className={`modal${size === 'small' ? ' modal-small' : ''}`}
        role="dialog"
        aria-modal="true"
        style={{ transform: `translate(${offset}px, ${offset}px)` }}
      >
        <header className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
