import { useMemo } from 'react';
import { MOOD_LABELS, countToday, useAppStore, useTodayMood } from '@/store/useAppStore';
import { bestStreak } from '@/shared/utils/stats';
import { dateKey } from '@/shared/utils/date';
import type { ChatCtx } from './engine/types';

// Данные приложения, которые знает помощник. Всё берётся с телефона, наружу ничего не уходит.
export function useChatContext(): ChatCtx {
  const name = useAppStore((s) => s.name);
  const habits = useAppStore((s) => s.habits);
  const tasks = useAppStore((s) => s.tasks);
  const mood = useTodayMood();
  return useMemo(() => {
    const good = habits.filter((h) => h.kind === 'good');
    return {
      name: name.trim(),
      mood,
      moodLabel: mood ? MOOD_LABELS[mood] : null,
      habitsDone: good.filter((h) => countToday(h) >= h.goal).length,
      habitsTotal: good.length,
      streak: bestStreak(good),
      tasksToday: tasks.filter((t) => t.date === dateKey() && !t.done).length,
      hour: new Date().getHours(),
    };
  }, [name, habits, tasks, mood]);
}
