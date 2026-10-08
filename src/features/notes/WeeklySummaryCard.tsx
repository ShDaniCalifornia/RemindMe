import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { MOOD_LABELS, useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/useTheme';
import { font } from '@/theme/tokens';
import { weeklySummary } from './weeklySummary';

export function WeeklySummaryCard() {
  const { colors } = useTheme();
  const notes = useAppStore((s) => s.notes);
  const moodLog = useAppStore((s) => s.moodLog);
  const habits = useAppStore((s) => s.habits);
  const sum = useMemo(() => weeklySummary(notes, moodLog, habits, MOOD_LABELS), [notes, moodLog, habits]);
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="sparkles-outline" size={18} color={colors.primaryDeep} />
        <Text style={[font.h2, { color: colors.text }]}>{sum.title}</Text>
      </View>
      {sum.lines.map((l, i) => (
        <Text key={i} style={{ color: sum.empty ? colors.textMuted : colors.text }}>{l}</Text>
      ))}
    </Card>
  );
}
