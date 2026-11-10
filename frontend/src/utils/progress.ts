function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

export function formatPercent(percent: number): string {
  return `${Math.round(clampPercent(percent))}%`;
}

export function barWidth(percent: number): string {
  return `${clampPercent(percent)}%`;
}
