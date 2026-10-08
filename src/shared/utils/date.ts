const pad = (n: number) => String(n).padStart(2, '0');

// Ключ дня по ЛОКАЛЬНОМУ времени: "2026-10-04" (toISOString даёт UTC и ошибается около полуночи)
export const dateKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']; // порядок Date.getDay()

export const formatDay = (k: string) => {
  const d = parseKey(k);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
};

export const formatDayLong = (k: string) => {
  if (k === dateKey()) return 'Сегодня';
  if (k === dateKey(addDays(new Date(), 1))) return 'Завтра';
  return formatDay(k);
};

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
