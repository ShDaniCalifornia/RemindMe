export const norm = (s: string) =>
  s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

// Совпадение с началом слова: W('уста') найдёт «устал», «усталость»
export const W = (...stems: string[]) => new RegExp('(?:^|\\s)(?:' + stems.join('|') + ')');
