import { useEffect, useState } from 'react';
import { ApiError } from '../../api';

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Понятный текст для типичных ошибок сервиса аналитики.
function describe(e: unknown, path: string): string {
  if (e instanceof ApiError && e.status === 404 && e.message === 'Ошибка 404') {
    return `Маршрут ${path} не найден. Проверь MapGet в Analytics и маршрут /api/stats в шлюзе.`;
  }
  return e instanceof Error ? e.message : 'Не удалось загрузить данные';
}

// Загружает один блок страницы. Каждый блок грузится и падает независимо от остальных.
// reloadKey — всё, при изменении чего блок надо перезагрузить (версия данных, период).
export function useLoad<T>(load: () => Promise<T>, path: string, reloadKey: string): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ data: null, error: null, loading: true });

  useEffect(() => {
    // cancelled: если период переключили до ответа, старый ответ не перезапишет новый
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    load()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ data: null, error: describe(e, path), loading: false });
      });
    return () => {
      cancelled = true;
    };
    // load меняется на каждом рендере (замыкание с периодом), перезагрузка — только по reloadKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return state;
}
