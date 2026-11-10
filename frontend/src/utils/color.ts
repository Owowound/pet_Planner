// Цвета задач и тегов хранятся на сервере строкой "#rrggbb".
// Здесь — пресеты, перевод между HEX и HSV для круга выбора и подбор цвета текста.

export const PRESETS: { name: string; value: string }[] = [
  { name: 'Зелёный', value: '#2f9e44' },
  { name: 'Синий', value: '#3b6ef5' },
  { name: 'Жёлтый', value: '#f5c211' },
  { name: 'Красный', value: '#e03131' },
  { name: 'Оранжевый', value: '#f76707' },
  { name: 'Фиолетовый', value: '#7c3aed' },
  { name: 'Бирюзовый', value: '#0c8599' },
  { name: 'Серый', value: '#64748b' },
];

export const DEFAULT_COLOR = '#3b6ef5';

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

// Если сервер по какой-то причине не прислал цвет, рисуем цветом по умолчанию.
export function colorOf(item: { color?: string | null }): string {
  return item.color && isHexColor(item.color) ? item.color.toLowerCase() : DEFAULT_COLOR;
}

// Для нового тега: случайный пресет, чтобы быстро созданные теги различались.
export function randomPreset(): string {
  return PRESETS[Math.floor(Math.random() * PRESETS.length)].value;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

// Светлый фон (жёлтый, светло-серый) требует тёмного текста, иначе белые буквы не читаются.
// Считаем относительную яркость по формуле WCAG.
export function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35;
}

export function textColorOn(hex: string): string {
  return isLight(hex) ? '#1d2129' : '#ffffff';
}

// HSV: h — оттенок 0..360 (угол на круге), s — насыщенность 0..1 (расстояние от центра),
// v — яркость 0..1 (ползунок под кругом).
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export function hexToHsv(hex: string): Hsv {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
