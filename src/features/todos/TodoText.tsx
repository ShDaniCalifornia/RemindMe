import { Text } from 'react-native';
import { Todo } from '@/store/useAppStore';
import { onColor } from '@/shared/utils/color';
import { useTheme } from '@/theme/useTheme';

// Текст задачи с оформлением: заголовок, жирный, курсив, подчёркивание, зачёркивание, цвет и выделение
export function TodoText({ todo }: { todo: Pick<Todo, 'text' | 'done' | 'heading' | 'style'> }) {
  const { colors } = useTheme();
  const s = todo.style ?? {};
  const decorations = [s.underline && 'underline', (s.strike || todo.done) && 'line-through'].filter(Boolean).join(' ');
  const color = todo.done ? colors.textMuted : s.color ?? (s.bg ? onColor(s.bg) : colors.text);
  return (
    <Text
      style={{
        color,
        backgroundColor: s.bg,
        fontSize: todo.heading ? 20 : 16,
        fontWeight: todo.heading || s.bold ? '700' : '400',
        fontStyle: s.italic ? 'italic' : 'normal',
        textDecorationLine: (decorations || 'none') as 'none' | 'underline' | 'line-through' | 'underline line-through',
        fontFamily: todo.heading ? 'serif' : undefined,
      }}
    >
      {todo.text}
    </Text>
  );
}
