import type { GeneralStats, NewTask, StatsPeriod, Tag, TaskDetails, TaskFields, TaskNode, TaskShort } from './types';

// Все запросы идут на относительный путь /api.
// В разработке их перехватывает прокси Vite и отправляет на шлюз (см. vite.config.ts).
const BASE = '/api/tasks';
const TAGS = '/api/tags';
const STATS = '/api/stats';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Запущены ли шлюз и сервис?', 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  // 204 No Content и 201 без тела — читать нечего.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Бэкенд отдаёт ошибки в формате ProblemDetails: { title, detail, status }.
async function readErrorMessage(response: Response): Promise<string> {
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return response.url.includes(STATS)
      ? 'Шлюз не смог связаться с сервисом аналитики. Analytics запущен?'
      : 'Шлюз не смог связаться с сервисом календаря. Сервис запущен?';
  }

  try {
    const problem = await response.json();
    if (problem?.detail) return problem.detail;
    if (problem?.title) return problem.title;
  } catch {
    // Тело не JSON — например, пустой 404 от маршрутизации.
  }

  return `Ошибка ${response.status}`;
}

export const api = {
  // Бэкенд включает обе границы периода: dateEnd — последний день выборки.
  getTasks: (dateStart: string, dateEnd: string) =>
    request<TaskShort[]>(`${BASE}?dateStart=${dateStart}&dateEnd=${dateEnd}`),

  getTask: (id: string) => request<TaskDetails>(`${BASE}/${id}`),

  createTask: (task: NewTask) =>
    request<{ id: string }>(BASE, { method: 'POST', body: JSON.stringify(task) }),

  addProgress: (id: string, additionalProgress: number) =>
    request<void>(`${BASE}/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ additionalProgress }),
    }),

  addSubTask: (parentId: string, childId: string) =>
    request<void>(`${BASE}/${parentId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ childId }),
    }),

  // PUT заменяет редактируемые поля задачи целиком.
  updateTask: (id: string, task: TaskFields) =>
    request<void>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(task) }),

  // Удаляет задачу вместе со всеми подзадачами на любой глубине.
  deleteTask: (id: string) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  // Справочник тегов.
  getTags: () => request<Tag[]>(TAGS),

  createTag: (name: string, color: string) =>
    request<{ id: string }>(TAGS, { method: 'POST', body: JSON.stringify({ name, color }) }),

  // PUT заменяет тег целиком: имя и цвет.
  updateTag: (id: string, name: string, color: string) =>
    request<void>(`${TAGS}/${id}`, { method: 'PUT', body: JSON.stringify({ name, color }) }),

  // Удаляет тег из справочника и со всех задач.
  deleteTag: (id: string) => request<void>(`${TAGS}/${id}`, { method: 'DELETE' }),

  // Аналитика. Период полуоткрытый: [from, to).
  getGeneralStats: (period: StatsPeriod) => request<GeneralStats>(`${STATS}/general${periodQuery(period)}`),
  getTrees: (period: StatsPeriod) => request<TaskNode[]>(`${STATS}/trees${periodQuery(period)}`),
};

// ?from=...&to=... только для заданных границ. Без параметров — «за всё время».
function periodQuery(period: StatsPeriod): string {
  const params = new URLSearchParams();
  if (period.from) params.set('from', period.from);
  if (period.to) params.set('to', period.to);
  const query = params.toString();
  return query ? `?${query}` : '';
}
