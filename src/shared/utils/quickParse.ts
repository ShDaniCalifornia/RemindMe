import { addDays, dateKey } from './date';
import type { Priority } from './tasks';

export type ParsedTask = {
  title: string;
  date: string;
  time?: string;
  category: 'work' | 'personal' | 'health';
  priority: Priority;
};

const WEEKDAYS: [RegExp, number][] = [
  [/понедельник/i, 1], [/вторник/i, 2], [/сред[уа]/i, 3], [/четверг/i, 4],
  [/пятниц[уа]/i, 5], [/суббот[уа]/i, 6], [/воскресень[ея]/i, 0],
];

const HEALTH = /лекарств|таблетк|врач|аптек|зарядк|йог|трениров|прогулк|вод[уы]|витамин|анализ|медитац|массаж|стоматолог/i;
const WORK = /работ|письм|созвон|встреч|отч[её]т|проект|клиент|презентац|дедлайн|совещан|коллег|заказ|договор/i;

// Разбор фразы вроде «Купить лекарства завтра в 18:00» без ИИ: правила + ключевые слова
export function parseQuickTask(input: string, now: Date = new Date()): ParsedTask {
  let text = ` ${input.trim()} `;
  const take = (re: RegExp): RegExpMatchArray | null => {
    const m = text.match(re);
    if (m) text = text.replace(re, ' ');
    return m;
  };

  // приоритет
  let priority: Priority = 'normal';
  if (take(/\s(?:срочно|!{2,})(?=\s|$)/i)) priority = 'urgent';
  else if (take(/\sважно(?=\s|$)/i)) priority = 'important';

  // дата
  let date = dateKey(now);
  let m: RegExpMatchArray | null;
  if (take(/\sпослезавтра(?=\s|$)/i)) date = dateKey(addDays(now, 2));
  else if (take(/\sзавтра(?=\s|$)/i)) date = dateKey(addDays(now, 1));
  else if (take(/\sсегодня(?=\s|$)/i)) date = dateKey(now);
  else if ((m = take(/\sчерез\s+(\d{1,2})\s+(?:дн\S*|день)(?=\s|$)/i))) date = dateKey(addDays(now, Number(m[1])));
  else if (take(/\sчерез\s+неделю(?=\s|$)/i)) date = dateKey(addDays(now, 7));
  else {
    for (const [re, wd] of WEEKDAYS) {
      const wm = take(new RegExp(`\\s(?:в|во)\\s+${re.source}(?=\\s|$)`, 'i'));
      if (wm) {
        let diff = (wd - now.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        date = dateKey(addDays(now, diff));
        break;
      }
    }
    if ((m = take(/\s(\d{1,2})[./](\d{1,2})(?=\s|$)/))) {
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      let d = new Date(now.getFullYear(), month, day);
      if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(now.getFullYear() + 1, month, day);
      date = dateKey(d);
    }
  }

  // время: «в 18:00», «18.30», «в 18», «в 6 вечера»
  let time: string | undefined;
  const setTime = (h: number, min: number, part?: string) => {
    if (part && /вечера|дня/i.test(part) && h < 12) h += 12;
    if (h > 23 || min > 59) return;
    time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };
  if ((m = take(/\s(?:в|к)?\s*(\d{1,2})[:.](\d{2})(?:\s*(вечера|дня|утра))?(?=\s|$)/i))) setTime(Number(m[1]), Number(m[2]), m[3]);
  else if ((m = take(/\s(?:в|к)\s+(\d{1,2})(?:\s*час\S*)?(?:\s*(вечера|дня|утра))?(?=\s|$)/i))) setTime(Number(m[1]), 0, m[2]);

  // заголовок
  let title = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:в|на|к|до|во)\s+/i, '')
    .replace(/\s+(?:в|на|к|до|во)$/i, '')
    .trim();
  if (!title) title = input.trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const category = HEALTH.test(input) ? 'health' : WORK.test(input) ? 'work' : 'personal';
  return { title, date, time, category, priority };
}
