export const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const normalizeHex = (s: string): string | null => {
  let t = s.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(t)) t = t.split('').map((c) => c + c).join('');
  return /^[0-9a-fA-F]{6}$/.test(t) ? `#${t.toUpperCase()}` : null;
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const S = s / 100;
  const L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`.toUpperCase();
};

// читаемый цвет текста поверх заданного фона
export const onColor = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.4 ? '#2A2A2A' : '#FFFFFF';
};
