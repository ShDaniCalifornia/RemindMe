export type Priority = 'normal' | 'important' | 'urgent';
export type TaskLike = { done: boolean; priority?: Priority; time?: string };

export const prioRank = (p?: Priority) => (p === 'urgent' ? 0 : p === 'important' ? 1 : 2);
export const isPrio = (t: TaskLike) => t.priority === 'urgent' || t.priority === 'important';

// невыполненные сверху, затем приоритет, затем время
export function compareTasks(a: TaskLike, b: TaskLike) {
  if (a.done !== b.done) return Number(a.done) - Number(b.done);
  const pr = prioRank(a.priority) - prioRank(b.priority);
  if (pr) return pr;
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time) return -1;
  if (b.time) return 1;
  return 0;
}

export const normalizeTime = (s: string): string | null => {
  const m = s.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};
