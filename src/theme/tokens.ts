export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };

export const font = {
  // заголовки: serif, как на макетах; на Android/iOS системные варианты
  title: { fontFamily: 'serif', fontSize: 32, letterSpacing: 0.2 } as const,
  h2: { fontSize: 17, fontWeight: '600' } as const,
  body: { fontSize: 15 } as const,
  caption: { fontSize: 12 } as const,
};
