import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { useTheme } from '@/theme/useTheme';
import { MONTHS, dateKey, parseKey } from '@/shared/utils/date';

const WEEK = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

type Props = { selected: string; onSelect: (key: string) => void; marked: Set<string> };

export function MonthCalendar({ selected, onSelect, marked }: Props) {
  const { colors } = useTheme();
  const sel = parseKey(selected);
  const [cursor, setCursor] = useState(new Date(sel.getFullYear(), sel.getMonth(), 1));
  const todayKey = dateKey();

  const first = (cursor.getDay() + 6) % 7; // понедельник = 0
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const move = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <Card>
      <View style={styles.head}>
        <Pressable onPress={() => move(-1)} hitSlop={12}><Ionicons name="chevron-back" size={20} color={colors.text} /></Pressable>
        <Text style={{ color: colors.text, fontWeight: '600' }}>
          {MONTHS[cursor.getMonth()][0].toUpperCase() + MONTHS[cursor.getMonth()].slice(1)} {cursor.getFullYear()}
        </Text>
        <Pressable onPress={() => move(1)} hitSlop={12}><Ionicons name="chevron-forward" size={20} color={colors.text} /></Pressable>
      </View>
      <View style={styles.grid}>
        {WEEK.map((w) => (
          <Text key={w} style={[styles.cell, { color: colors.textMuted, fontSize: 12 }]}>{w}</Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cellWrap} />;
          const key = dateKey(new Date(cursor.getFullYear(), cursor.getMonth(), d));
          const isSel = key === selected;
          return (
            <Pressable key={i} style={styles.cellWrap} onPress={() => onSelect(key)}>
              <View
                style={[
                  styles.day,
                  key === todayKey && !isSel && { borderWidth: 1, borderColor: colors.primary },
                  isSel && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={{ color: isSel ? '#fff' : colors.text }}>{d}</Text>
              </View>
              <View style={[styles.dot, { backgroundColor: marked.has(key) ? colors.accent : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', textAlign: 'center', paddingVertical: 6 },
  cellWrap: { width: '14.28%', alignItems: 'center', paddingVertical: 2 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
