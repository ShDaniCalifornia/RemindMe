import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Props = { title: string; onPress: () => void; variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean };

export function Button({ title, onPress, variant = 'primary', disabled }: Props) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.primary : 'transparent';
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.accent : colors.text;
  const border = variant === 'primary' ? 'transparent' : variant === 'danger' ? colors.accent : colors.border;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : 1 }]}
    >
      <Text style={{ color: fg, fontWeight: '600', fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, borderRadius: 999, alignItems: 'center', borderWidth: 1 },
});
