import type { MoodId } from '../../../shared/utils/stats';

export type Pose = 'calm' | 'happy' | 'cheer' | 'shy' | 'sleep' | 'thinking' | 'worried' | 'loving';

export type ChatAction =
  | { type: 'say'; text: string }
  | { type: 'mood'; mood: MoodId }
  | { type: 'route'; path: string }
  | { type: 'game' }
  | { type: 'breathing' }
  | { type: 'focus' }
  | { type: 'diary'; prompt?: string }
  | { type: 'plan' }
  | { type: 'thoughts' }
  | { type: 'stress' }
  | { type: 'help' };

export type ChipDef = {
  label: string;
  action: ChatAction;
  pose?: Pose; // поза персонажа при нажатии
  say?: string; // реплика помощницы перед действием
};

export type ChatCtx = {
  name: string;
  mood: MoodId | null;
  moodLabel: string | null;
  habitsDone: number;
  habitsTotal: number;
  streak: { title: string; days: number } | null;
  tasksToday: number;
  hour: number;
};

export type Mem = {
  used: Record<string, number>;
  lastIntent: string | null;
  fallbacks: number;
  mode: 'talk' | 'plan';
  turns: number;
  heavyUntil: number; // до какого хода разговор «тяжёлый»: шутки отключены
};

export type BotReply = {
  intent: string;
  text: string; // пустой текст = только действие
  chips?: ChipDef[];
  action?: ChatAction;
  pose?: Pose;
  crisis?: boolean;
};
