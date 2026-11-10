// Типы повторяют DTO бэкенда. ASP.NET отдаёт JSON в camelCase.

// Тег задачи: GET /api/tags. Цвет хранится на сервере строкой "#rrggbb".
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Элемент списка для календаря: GET /api/tasks?dateStart=...&dateEnd=...
export interface TaskShort {
  id: string;
  name: string;
  deadline: string; // ISO-строка в UTC
  goal: number;
  progress: number;
  progressPercent: number;
  isCompleted: boolean;
  parentId: string | null;
  children: string[];
  color: string; // "#rrggbb"
  tags?: Tag[]; // собственные теги задачи; необязателен, пока бэкенд их не отдаёт
}

// Подзадача внутри карточки задачи. Вложенные подзадачи образуют дерево любой глубины.
// subTasks необязателен: если бэкенд отдаёт только прямых детей, дерево будет в один уровень.
export interface SubTaskInfo {
  id: string;
  name: string;
  deadline: string;
  progressPercent: number;
  isCompleted: boolean;
  color: string;
  subTasks?: SubTaskInfo[];
}

// Карточка задачи: GET /api/tasks/{id}
export interface TaskDetails {
  id: string;
  name: string;
  description: string;
  deadline: string;
  goal: number;
  progress: number;
  progressPercent: number;
  childProgressPercent: number;
  isCompleted: boolean;
  parentId: string | null;
  subTasks: SubTaskInfo[];
  color: string;
  tags?: Tag[];
}

// Редактируемые поля задачи: тело POST /api/tasks и PUT /api/tasks/{id}.
export interface TaskFields {
  name: string;
  description: string;
  deadline: string; // ISO-строка в UTC
  goal: number;
  color: string; // "#rrggbb"
  tags: string[]; // id выбранных тегов
}

export type NewTask = TaskFields;

// ---------- Аналитика (сервис Analytics, через шлюз /api/stats) ----------

// GET /api/stats/general — сводка за период.
export interface GeneralStats {
  completed: number; // сколько задач стали выполненными за период
  percentComplete: number | null; // средний прогресс корней на конец; null, если задач нет
  startPercentComplete: number | null; // то же на начало; null в режиме «за всё время»
}

// Период статистики [from, to) в ISO UTC. null — граница не задана.
export interface StatsPeriod {
  from: string | null;
  to: string | null;
}

// GET /api/stats/trees — дерево задач с процентами. Children рекурсивны.
export interface TaskNode {
  taskId: string;
  name: string;
  color: string;
  ownPercent: number;
  goal: number;
  progress: number;
  treePercent: number;
  isCompleted: boolean;
  startTreePercent: number | null;
  children: TaskNode[];
  tagIds: string[];
}
