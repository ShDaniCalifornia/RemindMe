import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const { colors } = useTheme();
  const btn = (label: string, next: number) => (
    <Pressable
      onPress={() => onChange(Math.min(max, Math.max(min, next)))}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: colors.text, fontSize: 22 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
      {btn('−', value - 1)}
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '600', minWidth: 36, textAlign: 'center' }}>{value}</Text>
      {btn('+', value + 1)}
    </View>
  );
}
