import type { MoodId } from "../../../shared/utils/stats";
import type { Intent } from "./content";
import {
  BREATHE,
  DIARY,
  FALLBACKS,
  GAME,
  INTENTS,
  MOOD_CHIPS,
  QUICK_CHIPS,
  SIT,
  THOUGHT_CHIPS,
  VENT,
} from "./content";
import { PERSONA } from "./persona";
import { norm } from "./text";
import type {
  BotReply,
  ChatAction,
  ChatCtx,
  ChipDef,
  Mem,
  Pose,
} from "./types";

export const createMem = (): Mem => ({
  used: {},
  lastIntent: null,
  fallbacks: 0,
  mode: "talk",
  turns: 0,
  heavyUntil: -1,
});

// выбираем реже всего использованный вариант, чтобы помощница не повторялась
function pick(mem: Mem, key: string, options: string[]): string {
  let best: number[] = [];
  let min = Infinity;
  options.forEach((_, i) => {
    const c = mem.used[`${key}:${i}`] ?? 0;
    if (c < min) {
      min = c;
      best = [i];
    } else if (c === min) best.push(i);
  });
  const i = best[Math.floor(Math.random() * best.length)];
  mem.used[`${key}:${i}`] = (mem.used[`${key}:${i}`] ?? 0) + 1;
  return options[i];
}

export const fill = (s: string, ctx: ChatCtx) =>
  s
    .replace(/\{name\}/g, ctx.name ? `, ${ctx.name}` : "")
    .replace(/\{done\}/g, String(ctx.habitsDone))
    .replace(/\{total\}/g, String(ctx.habitsTotal))
    .replace(/\{tasks\}/g, String(ctx.tasksToday))
    .replace(/\{persona\}/g, PERSONA.name)
    .replace(/\{nick\}/g, PERSONA.nick);

// тяжёлый разговор: шутки и болтовня уступают место мягким репликам
export const isHeavy = (ctx: ChatCtx, mem: Mem) =>
  mem.turns <= mem.heavyUntil || ctx.mood === "low" || ctx.mood === "anxious";

const eligible = (it: Intent, ctx: ChatCtx, mem: Mem): string[] =>
  it.replies
    .filter((r) => typeof r === "string" || r.when(ctx, mem))
    .map((r) => (typeof r === "string" ? r : r.text));

// Дописываем фразу про привычки или серию (по одному разу за разговор)
function addon(ctx: ChatCtx, mem: Mem): string {
  if (
    ctx.habitsTotal > 0 &&
    ctx.habitsDone === ctx.habitsTotal &&
    !mem.used["addon:all"]
  ) {
    mem.used["addon:all"] = 1;
    return " При этом все привычки на сегодня отмечены. Это тоже забота о себе.";
  }
  if (ctx.streak && ctx.streak.days >= 3 && !mem.used["addon:streak"]) {
    mem.used["addon:streak"] = 1;
    return ` Кстати, держится серия «${ctx.streak.title}»: ${ctx.streak.days} дн. Это тоже про заботу о себе.`;
  }
  return "";
}

const OPEN_UP: ChipDef[] = [VENT, BREATHE, SIT];

export function reply(input: string, ctx: ChatCtx, mem: Mem): BotReply {
  const t = norm(input);
  mem.turns++;

  // короткие «да» / «нет» зависят от предыдущей темы
  if (/^(?:да|ага|угу|ну да|наверное|давай|хорошо|ладно)$/.test(t)) {
    if (
      ["tired", "anxious", "overwhelmed", "sleep"].includes(
        mem.lastIntent ?? "",
      )
    )
      return {
        intent: "yes_breathe",
        text: "Тогда давай подышим вместе. Это займёт пару минут.",
        action: { type: "breathing" },
        pose: "calm",
      };
    if (mem.lastIntent === "happy")
      return {
        intent: "yes_diary",
        text: "Давай запишем, пока свежо.",
        action: { type: "diary", prompt: "Что сегодня порадовало?" },
        pose: "happy",
      };
    return {
      intent: "yes",
      text: "Хорошо. Я слушаю, продолжай.",
      pose: "calm",
    };
  }
  if (/^(?:нет|не хочу|не надо|не знаю|не уверен\S*)$/.test(t)) {
    mem.lastIntent = "no";
    return {
      intent: "no",
      text: "Хорошо, без давления. Можем просто посидеть тихо или заняться чем-то другим.",
      chips: [SIT, GAME, DIARY],
      pose: "calm",
    };
  }

  let best: Intent | null = null;
  for (const it of INTENTS) {
    if (
      it.test.some((r) => r.test(t)) &&
      (!best || it.priority > best.priority)
    )
      best = it;
  }
  if (!best) return fallback(input, t, ctx, mem);

  mem.fallbacks = 0;
  mem.lastIntent = best.id;
  if (best.heavy) mem.heavyUntil = mem.turns + 4;

  const pool =
    best.gentle && isHeavy(ctx, mem) ? best.gentle : eligible(best, ctx, mem);
  let text = fill(pick(mem, best.id, pool), ctx);
  if (best.addon && text) text += addon(ctx, mem);
  return {
    intent: best.id,
    text,
    chips: best.chips,
    action: best.action,
    pose: best.pose,
  };
}

function fallback(input: string, t: string, ctx: ChatCtx, mem: Mem): BotReply {
  mem.fallbacks++;
  mem.lastIntent = "fallback";
  if (mem.fallbacks >= 3) {
    mem.fallbacks = 0;
    return {
      intent: "menu",
      text: "Кажется, мы ходим вокруг да около. Давай я предложу, чем могу помочь:",
      chips: [...QUICK_CHIPS, BREATHE],
      pose: "thinking",
    };
  }
  // эхо: возвращаем сказанное как вопрос
  if (/^(?:я|мне)\s/.test(t) || t.includes("чувствую")) {
    const quote = input
      .trim()
      .replace(/[.!?…]+$/, "")
      .slice(0, 70);
    if (quote.length >= 8)
      return {
        intent: "echo",
        text: `Слышу: «${quote}». Что за этим стоит для тебя?`,
        pose: "calm",
      };
  }
  return {
    intent: "fallback",
    text: fill(pick(mem, "fallback", FALLBACKS), ctx),
    pose: "thinking",
  };
}

const OPENERS = {
  morning: [
    "Доброе утро{name}! Ушки навострены, очки на лбу, готова к делам.",
    "Доброе утро{name}. Я уже тут и даже почти проснулась.",
  ],
  day: [
    "Привет{name}! Я как раз думала о тебе. Ну, или о печеньках, но о тебе тоже.",
    "Привет{name}. Рада тебя видеть.",
  ],
  evening: [
    "Добрый вечер{name}. Самое время выдохнуть.",
    "Добрый вечер{name}! Хорошо, что ты здесь.",
  ],
  night: [
    "Привет{name}. Поздновато, но я не сплю, я же в телефоне.",
    "Не спится{name}? Я рядом.",
  ],
};

export function greeting(ctx: ChatCtx, mem: Mem): BotReply {
  const h = ctx.hour;
  const group =
    h >= 5 && h < 12
      ? "morning"
      : h >= 12 && h < 18
        ? "day"
        : h >= 18 && h < 23
          ? "evening"
          : "night";
  const hi = fill(pick(mem, `open:${group}`, OPENERS[group]), ctx);
  mem.lastIntent = "greeting";

  if (ctx.mood) {
    const r = moodReply(ctx.mood, ctx, mem, true);
    return {
      ...r,
      text: `${hi} Сегодня в настроении отмечено: «${ctx.moodLabel}». ${r.text}`,
    };
  }
  if (ctx.habitsTotal > 0 && ctx.habitsDone === ctx.habitsTotal)
    return {
      intent: "greet_habits",
      text: `${hi} Все привычки на сегодня отмечены. Как ты себя чувствуешь?`,
      chips: MOOD_CHIPS,
      pose: "happy",
    };
  if (ctx.streak && ctx.streak.days >= 3)
    return {
      intent: "greet_streak",
      text: `${hi} Серия «${ctx.streak.title}» уже ${ctx.streak.days} дн. Как ты сегодня?`,
      chips: MOOD_CHIPS,
      pose: "happy",
    };
  return {
    intent: "greet",
    text: `${hi} Как ты сегодня?`,
    chips: MOOD_CHIPS,
    pose: "calm",
  };
}

export function moodReply(
  mood: MoodId,
  ctx: ChatCtx,
  mem: Mem,
  short = false,
): BotReply {
  mem.lastIntent =
    mood === "tired"
      ? "tired"
      : mood === "anxious"
        ? "anxious"
        : mood === "happy"
          ? "happy"
          : "mood";
  if (mood === "tired" || mood === "anxious" || mood === "low")
    mem.heavyUntil = mem.turns + 4;
  const map: Record<MoodId, { text: string; chips: ChipDef[]; pose: Pose }> = {
    calm: {
      text: "Спокойствие хорошее состояние. Хочешь записать пару слов в дневник, чтобы его запомнить?",
      chips: [DIARY, GAME],
      pose: "calm",
    },
    tired: {
      text: "Давай сегодня без героизма. Выговоришься или подышим?",
      chips: OPEN_UP,
      pose: "worried",
    },
    anxious: {
      text: "Тревога бывает громкой, но проходит волнами. Подышим вместе или сначала выговоришься?",
      chips: [BREATHE, VENT],
      pose: "worried",
    },
    happy: {
      text: "Как приятно! Что порадовало? Это можно сохранить в дневнике.",
      chips: [
        {
          label: "В дневник",
          action: { type: "diary", prompt: "Что сегодня порадовало?" },
        },
      ],
      pose: "happy",
    },
    low: {
      text: "Мне жаль, что день не из лёгких. Расскажешь, что случилось, или посидим тихо?",
      chips: [VENT, SIT, GAME],
      pose: "worried",
    },
  };
  const m = map[mood];
  const text = short
    ? m.text
    : `Отметила: «${ctx.moodLabel ?? ""}». ${m.text}`
        .replace("«»", "")
        .replace("Отметила:  ", "Отметила. ");
  return { intent: `mood_${mood}`, text, chips: m.chips, pose: m.pose };
}

export function thoughtsReply(): BotReply {
  return {
    intent: "thoughts",
    text: "Давай разберём по шагам. Выбери вопрос, и я открою дневник с ним.",
    chips: THOUGHT_CHIPS,
    pose: "thinking",
  };
}

export function stressReply(): BotReply {
  return {
    intent: "stress",
    text: "Что сейчас ближе?",
    chips: [BREATHE, GAME, SIT],
    pose: "calm",
  };
}

export const planIntro = (): BotReply => ({
  intent: "plan_intro",
  text:
    "Давай. Пиши задачи по одной. " +
    "Можно сразу уточнить день: " +
    "«Купить лекарства завтра в 18:00». " +
    "Когда закончишь — «готово».",
  chips: [
    {
      label: "Готово",
      action: {
        type: "say",
        text: "готово",
      },
    },
  ],
  pose: "thinking",
});

export type { ChatAction };
