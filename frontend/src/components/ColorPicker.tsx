import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { PRESETS, hexToHsv, hsvToHex, isHexColor, type Hsv } from '../utils/color';

// ---------- Круг выбора цвета ----------
// Оттенок — угол по кругу, насыщенность — расстояние от центра, яркость — ползунок под кругом.

interface ColorWheelProps {
  value: string;
  onChange: (hex: string) => void;
}

const WHEEL_SIZE = 184;

function ColorWheel({ value, onChange }: ColorWheelProps) {
  // HSV храним отдельно: у белого и чёрного оттенок не определён,
  // и без этого ползунок яркости «терял» бы выбранный оттенок.
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const wheelRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Цвет поменяли снаружи (пресет, поле HEX) — подстраиваем круг.
  useEffect(() => {
    if (hsvToHex(hsv) !== value.toLowerCase()) setHsv(hexToHsv(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function update(next: Hsv) {
    setHsv(next);
    onChange(hsvToHex(next));
  }

  function pickFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = wheelRef.current!.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = event.clientX - rect.left - radius;
    const dy = event.clientY - rect.top - radius;
    // Угол от верхней точки по часовой стрелке — так же идёт conic-gradient.
    let h = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (h < 0) h += 360;
    const s = Math.min(1, Math.hypot(dx, dy) / radius);
    update({ h, s, v: hsv.v });
  }

  const angle = (hsv.h * Math.PI) / 180;
  const markerX = 50 + Math.sin(angle) * hsv.s * 50;
  const markerY = 50 - Math.cos(angle) * hsv.s * 50;
  const pureHue = hsvToHex({ h: hsv.h, s: hsv.s, v: 1 });

  return (
    <div className="color-wheel-block">
      <div
        ref={wheelRef}
        className="color-wheel"
        style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          pickFromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && pickFromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        role="slider"
        aria-label="Оттенок и насыщенность"
        aria-valuetext={value}
      >
        {/* Затемнение круга по яркости */}
        <div className="color-wheel-shade" style={{ opacity: 1 - hsv.v }} />
        <span className="color-wheel-marker" style={{ left: `${markerX}%`, top: `${markerY}%`, background: value }} />
      </div>

      <input
        className="color-brightness"
        type="range"
        min={0}
        max={100}
        value={Math.round(hsv.v * 100)}
        onChange={(e) => update({ ...hsv, v: Number(e.target.value) / 100 })}
        style={{ background: `linear-gradient(90deg, #000, ${pureHue})` }}
        aria-label="Яркость"
      />
    </div>
  );
}

// ---------- Пресеты ----------

interface PresetRowProps {
  value: string;
  onChange: (hex: string) => void;
  large?: boolean;
}

export function PresetRow({ value, onChange, large }: PresetRowProps) {
  return (
    <div className={`color-presets${large ? ' color-presets-large' : ''}`}>
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          className={`color-preset${preset.value === value.toLowerCase() ? ' is-active' : ''}`}
          style={{ background: preset.value }}
          onClick={() => onChange(preset.value)}
          title={preset.name}
          aria-label={preset.name}
        />
      ))}
    </div>
  );
}

// ---------- Всплывающее окно выбора ----------

interface ColorPopoverProps {
  anchor: HTMLElement;
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}

function ColorPopover({ anchor, value, onChange, onClose }: ColorPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hexText, setHexText] = useState(value);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => setHexText(value), [value]);

  // Окно рендерится в <body> через портал и позиционируется fixed относительно кнопки.
  // Внутри модального окна так нельзя: у него есть transform, и fixed-элемент
  // отсчитывался бы от окна, а не от экрана.
  useLayoutEffect(() => {
    const a = anchor.getBoundingClientRect();
    const p = ref.current!.getBoundingClientRect();
    const margin = 8;
    let left = a.left;
    let top = a.bottom + 6;
    if (left + p.width > window.innerWidth - margin) left = window.innerWidth - margin - p.width;
    if (top + p.height > window.innerHeight - margin) top = Math.max(margin, a.top - 6 - p.height);
    setPosition({ left: Math.max(margin, left), top });
    // Фокус внутрь окна: тогда Esc попадёт в него, а не закроет модальное окно под ним.
    ref.current!.focus();
  }, [anchor]);

  // Клик мимо окна закрывает его.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !anchor.contains(target)) onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      className="color-popover"
      style={position ? { left: position.left, top: position.top } : { visibility: 'hidden' }}
      role="dialog"
      aria-label="Выбор цвета"
      tabIndex={-1}
      onKeyDown={(e) => {
        // Esc закрывает только выбор цвета, а не всё модальное окно под ним.
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <ColorWheel value={value} onChange={onChange} />
      <PresetRow value={value} onChange={onChange} />
      <div className="color-hex-row">
        <span className="color-hex-preview" style={{ background: value }} />
        <input
          className="input color-hex-input"
          value={hexText}
          maxLength={7}
          spellCheck={false}
          onKeyDown={(e) => {
            // Enter в поле цвета не должен отправлять форму задачи.
            if (e.key === 'Enter') {
              e.preventDefault();
              onClose();
            }
          }}
          onChange={(e) => {
            let text = e.target.value.trim();
            if (text && !text.startsWith('#')) text = '#' + text;
            setHexText(text);
            if (isHexColor(text)) onChange(text.toLowerCase());
          }}
          aria-label="Цвет в формате HEX"
        />
        <button type="button" className="button button-small button-primary" onClick={onClose}>
          Готово
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ---------- Поле выбора цвета ----------
// Полный вид (форма задачи): ряд пресетов + кнопка «Свой цвет» с кругом.
// Компактный вид (окно тегов): только кружок текущего цвета, по клику — то же окно.

interface ColorFieldProps {
  value: string;
  onChange: (hex: string) => void;
  compact?: boolean;
}

export function ColorField({ value, onChange, compact }: ColorFieldProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const isCustom = !PRESETS.some((p) => p.value === value.toLowerCase());

  return (
    <div className={`color-field${compact ? ' color-field-compact' : ''}`}>
      {!compact && <PresetRow value={value} onChange={onChange} large />}
      <button
        type="button"
        className={compact ? 'color-swatch-button' : `button button-small color-custom-button${isCustom ? ' is-active' : ''}`}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        aria-expanded={anchor !== null}
        title="Выбрать цвет"
        aria-label="Выбрать цвет"
      >
        {compact ? (
          <span className="color-swatch" style={{ background: value }} />
        ) : (
          <>
            <span className="color-wheel-icon" />
            {isCustom ? <span className="color-swatch" style={{ background: value }} /> : null}
            Свой цвет
          </>
        )}
      </button>
      {anchor && <ColorPopover anchor={anchor} value={value} onChange={onChange} onClose={() => setAnchor(null)} />}
    </div>
  );
}
