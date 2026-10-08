import { addDays, dateKey } from './date';

export type HabitLike = { kind: 'good' | 'bad'; goal: number; log: Record<string, number> };
export type MoodId = 'calm' | 'tired' | 'anxious' | 'happy' | 'low';

export const habitDone = (h: HabitLike, key: string) => (h.log[key] ?? 0) >= h.goal;

// Серия: сколько дней подряд привычка выполнена. Если сегодня ещё не отмечено, серия не обрывается: считаем со вчера.
export function habitStreak(h: HabitLike, now: Date = new Date()): number {
  if (h.kind !== 'good') return 0;
  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!habitDone(h, dateKey(d))) d = addDays(d, -1);
  let n = 0;
  while (habitDone(h, dateKey(d)) && n < 3650) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function bestStreak<T extends HabitLike & { title: string }>(habits: T[], now: Date = new Date()) {
  let best: { title: string; days: number } | null = null;
  for (const h of habits) {
    const days = habitStreak(h, now);
    if (days > 0 && (!best || days > best.days)) best = { title: h.title, days };
  }
  return best;
}

// Доля выполненных полезных привычек за день
export function dayCompletion(habits: HabitLike[], key: string): { done: number; total: number } | null {
  const good = habits.filter((h) => h.kind === 'good');
  if (!good.length) return null;
  return { done: good.filter((h) => habitDone(h, key)).length, total: good.length };
}

// 0 = нет выполненных, 4 = выполнено всё
export function heatLevel(done: number, total: number): 0 | 1 | 2 | 3 | 4 {
  if (!total || done <= 0) return 0;
  const r = done / total;
  if (r >= 1) return 4;
  if (r > 0.66) return 3;
  if (r > 0.33) return 2;
  return 1;
}

export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
export const daysWord = (n: number) => `${n} ${plural(n, ['день', 'дня', 'дней'])}`;
