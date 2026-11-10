import { useMemo, useState } from 'react';
import { api } from '../../api';
import type { Tag } from '../../types';
import { formatPercent } from '../../utils/progress';
import { defaultPeriodState, PeriodPicker, resolvePeriod, type PeriodState } from './PeriodPicker';
import { StatsTree } from './StatsTree';
import { useLoad } from './useLoad';

interface StatsPageProps {
  version: number;
  onOpenTask: (id: string) => void;
}

function percentText(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? formatPercent(value) : '—';
}

// Страница аналитики: прогресс на начало и на конец периода.
// Сводка и деревья грузятся независимо: если один эндпоинт упал, второй всё равно покажется.
export function StatsPage({ version, onOpenTask }: StatsPageProps) {
  const [reload, setReload] = useState(0);
  const [periodState, setPeriodState] = useState<PeriodState>(defaultPeriodState);

  const resolved = resolvePeriod(periodState);
  const { period, isAllTime } = resolved;

  // Ключ перезагрузки: новые данные в календаре, кнопка «Обновить» или другой период.
  const key = `${version}:${reload}:${period.from ?? ''}:${period.to ?? ''}`;
  const skip = resolved.error !== null;

  const general = useLoad(() => api.getGeneralStats(period), '/api/stats/general', skip ? 'skip' : key);
  const trees = useLoad(() => api.getTrees(period), '/api/stats/trees', skip ? 'skip' : key);
  const tags = useLoad(api.getTags, '/api/tags', `${version}:${reload}`);

  const tagsById = useMemo(() => new Map<string, Tag>((tags.data ?? []).map((t) => [t.id, t])), [tags.data]);
  const loading = general.loading || trees.loading;

  const g = general.data;

  return (
    <section className="stats">
      <div className="stats-head">
        <PeriodPicker value={periodState} onChange={setPeriodState} />
        <button className="button button-small" onClick={() => setReload((r) => r + 1)} disabled={loading || skip}>
          {loading && !skip ? 'Загружаем…' : 'Обновить'}
        </button>
      </div>

      {resolved.error ? (
        <div className="banner banner-warning">{resolved.error}</div>
      ) : (
        <div className="muted stats-period-label">{resolved.label}</div>
      )}

      {!skip && (
        <>
          {/* Сводка */}
          <div className="stats-block">
            <div className="stats-block-title">Сводка</div>
            {general.error ? (
              <div className="banner banner-error">{general.error}</div>
            ) : (
              <div className="stats-tiles">
                <div className="stats-tile">
                  <span className="stats-tile-label">{isAllTime ? 'Выполнено задач' : 'Выполнено за период'}</span>
                  <span className="stats-tile-value">{g?.completed ?? '…'}</span>
                </div>
                {!isAllTime && (
                  <div className="stats-tile">
                    <span className="stats-tile-label">Средний прогресс на начало</span>
                    <span className="stats-tile-value">{g ? percentText(g.startPercentComplete) : '…'}</span>
                  </div>
                )}
                <div className="stats-tile">
                  <span className="stats-tile-label">{isAllTime ? 'Средний прогресс' : 'Средний прогресс на конец'}</span>
                  <span className="stats-tile-value">{g ? percentText(g.percentComplete) : '…'}</span>
                  {g && percentText(g.percentComplete) === '—' && <span className="stats-tile-note">задач нет</span>}
                </div>
              </div>
            )}
          </div>

          {tags.error && (
            <div className="banner banner-warning">Не загрузился справочник тегов, вместо имён будет «удалённый тег». {tags.error}</div>
          )}

          {/* Прогресс задач */}
          <div className="stats-block">
            <div className="stats-block-title">{isAllTime ? 'Прогресс задач' : 'Прогресс задач: было → стало'}</div>
            {trees.error ? (
              <div className="banner banner-error">{trees.error}</div>
            ) : trees.data ? (
              <StatsTree roots={trees.data} tagsById={tagsById} onOpenTask={onOpenTask} compareStart={!isAllTime} />
            ) : (
              <div className="muted stats-empty">Загружаем задачи…</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
