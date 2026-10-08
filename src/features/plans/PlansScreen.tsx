import { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { Chip } from '@/shared/components/Chip';
import { EmptyState } from '@/shared/components/EmptyState';
import { CATEGORIES, Task, TaskCategory, useAppStore } from '@/store/useAppStore';
import { dateKey, formatDayLong } from '@/shared/utils/date';
import { parseQuickTask } from '@/shared/utils/quickParse';
import { compareTasks, isPrio } from '@/shared/utils/tasks';
import { useTheme } from '@/theme/useTheme';
import { font } from '@/theme/tokens';
import { MonthCalendar } from './MonthCalendar';
import { TaskRow } from './TaskRow';

// Быстрая запись: «Купить лекарства завтра в 18:00» → задача в «Здоровье» на завтра
function QuickAdd({ onAdded }: { onAdded: (date: string) => void }) {
  const { colors } = useTheme();
  const addTask = useAppStore((s) => s.addTask);
  const [text, setText] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  const submit = () => {
    if (!text.trim()) return;
    const p = parseQuickTask(text);
    addTask({ title: p.title, date: p.date, time: p.time, category: p.category, priority: p.priority });
    const cat = CATEGORIES.find((c) => c.id === p.category)?.label;
    setInfo(`Добавлено: «${p.title}», ${formatDayLong(p.date).toLowerCase()}${p.time ? ` в ${p.time}` : ''} · ${cat}`);
    setText('');
    onAdded(p.date);
    Keyboard.dismiss();
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.quick, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          returnKeyType="done"
          placeholder="Быстро: купить лекарства завтра в 18:00"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 }}
        />
        <Pressable onPress={submit} hitSlop={8} accessibilityLabel="Добавить">
          <Ionicons name="arrow-up-circle" size={30} color={text.trim() ? colors.primary : colors.border} />
        </Pressable>
      </View>
      {info && <Text style={{ color: colors.textMuted, fontSize: 12 }}>{info}</Text>}
    </View>
  );
}

export function PlansScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const [selected, setSelected] = useState(dateKey());
  const [cat, setCat] = useState<'all' | TaskCategory>('all');

  const marked = useMemo(() => new Set(tasks.map((t) => t.date)), [tasks]);
  const list = tasks.filter((t) => t.date === selected && (cat === 'all' || t.category === cat)).sort(compareTasks);

  // группы: важное / по времени / остальное (задача попадает только в одну)
  const groups: { title: string; items: Task[] }[] = [
    { title: 'Важное', items: list.filter((t) => isPrio(t)) },
    { title: 'По времени', items: list.filter((t) => !isPrio(t) && t.time) },
    { title: 'Остальное', items: list.filter((t) => !isPrio(t) && !t.time) },
  ].filter((g) => g.items.length);

  return (
    <Screen>
      <ScreenHeader title="Планы" onAdd={() => router.push({ pathname: '/create-task', params: { date: selected } })} />
      <QuickAdd onAdded={setSelected} />
      <MonthCalendar selected={selected} onSelect={setSelected} marked={marked} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Все" active={cat === 'all'} onPress={() => setCat('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} active={cat === c.id} onPress={() => setCat(c.id)} />
        ))}
      </ScrollView>

      <Text style={[font.h2, { color: colors.text }]}>{formatDayLong(selected)}</Text>
      {groups.length === 0 ? (
        <EmptyState sprite="calm" title="На этот день пусто" hint="Напишите задачу выше или нажмите «+»." />
      ) : (
        <>
          {groups.map((g) => (
            <View key={g.title} style={{ gap: 8 }}>
              {groups.length > 1 && (
                <Text style={{ color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>{g.title}</Text>
              )}
              {g.items.map((t) => <TaskRow key={t.id} task={t} />)}
            </View>
          ))}
          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
            Нажмите, чтобы отметить. Удерживайте, чтобы удалить.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8 },
  quick: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 16, paddingRight: 8 },
});
