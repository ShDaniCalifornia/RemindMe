import { addDays, dateKey } from '../../shared/utils/date';
import { bestStreak, daysWord } from '../../shared/utils/stats';
import type { HabitLike, MoodId } from '../../shared/utils/stats';

type NoteLike = { kind: 'note' | 'diary'; text: string; createdAt: string };

const STOP = new Set([
  'просто', 'сегодня', 'потому', 'когда', 'очень', 'который', 'которые', 'только', 'после', 'опять', 'вообще',
  'всегда', 'можно', 'нужно', 'хочется', 'кажется', 'почему', 'может', 'будет', 'тогда', 'сейчас', 'больше',
  'тоже', 'чтобы', 'этого', 'этот', 'такой', 'своей', 'снова', 'ничего', 'совсем', 'хотя', 'вчера', 'завтра',
]);

// Итоги недели без ИИ: считаем по цифрам и словам из дневника. Всё происходит на телефоне.
export function weeklySummary(
  notes: NoteLike[],
  moodLog: Record<string, MoodId>,
  habits: (HabitLike & { title: string })[],
  labels: Record<MoodId, string>,
  now: Date = new Date(),
) {
  const since = dateKey(addDays(now, -6));
  const diary = notes.filter((n) => n.kind === 'diary' && dateKey(new Date(n.createdAt)) >= since);
  const moods = Object.entries(moodLog).filter(([k]) => k >= since && k <= dateKey(now)) as [string, MoodId][];
  const lines: string[] = [];

  if (diary.length) lines.push(`Записей в дневнике: ${diary.length}.`);

  if (moods.length) {
    const count: Record<string, number> = {};
    for (const [, m] of moods) count[m] = (count[m] ?? 0) + 1;
    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    lines.push(`Настроение отмечено ${moods.length} из 7 дней. Чаще всего: «${labels[top[0] as MoodId]}».`);
  }

  const streak = bestStreak(habits, now);
  if (streak && streak.days >= 2) lines.push(`Самая длинная серия: «${streak.title}», ${daysWord(streak.days)} подряд.`);

  const freq: Record<string, number> = {};
  for (const n of diary) {
    const words = n.text.toLowerCase().replace(/ё/g, 'е').match(/[а-яa-z]{5,}/g) ?? [];
    for (const w of words) if (!STOP.has(w)) freq[w] = (freq[w] ?? 0) + 1;
  }
  const topWords = Object.entries(freq).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
  if (topWords.length) lines.push(`Чаще всего в записях встречалось: ${topWords.join(', ')}.`);

  return {
    title: 'Итоги недели',
    lines: lines.length ? lines : ['Пока мало данных. Отметьте настроение и напишите пару записей, и здесь появится сводка.'],
    empty: lines.length === 0,
  };
}
