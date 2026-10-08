import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormScreen } from '@/shared/components/FormScreen';
import { TextField } from '@/shared/components/TextField';
import { Chip } from '@/shared/components/Chip';
import { Button } from '@/shared/components/Button';
import { CATEGORIES, TaskCategory, useAppStore } from '@/store/useAppStore';
import { WEEKDAYS_SHORT, addDays, dateKey, parseKey } from '@/shared/utils/date';
import { Priority, normalizeTime } from '@/shared/utils/tasks';
import { useTheme } from '@/theme/useTheme';

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'normal', label: 'Обычная' },
  { id: 'important', label: 'Важная' },
  { id: 'urgent', label: 'Срочная' },
];

export function CreateTaskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const addTask = useAppStore((s) => s.addTask);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [day, setDay] = useState(date ?? dateKey());
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [priority, setPriority] = useState<Priority>('normal');
  const [time, setTime] = useState('');
  const [timerOn, setTimerOn] = useState(false);
  const [timerChoice, setTimerChoice] = useState<'pomodoro' | number>('pomodoro');

  const timeOk = !time.trim() || normalizeTime(time) !== null;

  const base = new Date();
  const days = Array.from({ length: 14 }, (_, i) => dateKey(addDays(base, i)));
  if (!days.includes(day)) days.unshift(day);

  const save = () => {
    addTask({
      title: title.trim(),
      note: note.trim() || undefined,
      date: day,
      category,
      priority: priority === 'normal' ? undefined : priority,
      time: time.trim() ? normalizeTime(time)! : undefined,
      timer: timerOn ? timerChoice : undefined,
    });
    router.back();
  };

  return (
    <FormScreen title="Новая задача" footer={<Button title="Добавить" onPress={save} disabled={!title.trim() || !timeOk} />}>
      <TextField label="Что нужно сделать" value={title} onChangeText={setTitle} placeholder="Например, прогулка" autoFocus />
      <TextField label="Заметка (необязательно)" value={note} onChangeText={setNote} placeholder="20 минут" />

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Когда</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((k) => {
            const d = parseKey(k);
            const active = k === day;
            return (
              <Pressable
                key={k}
                onPress={() => setDay(k)}
                style={{ width: 54, paddingVertical: 8, borderRadius: 16, alignItems: 'center', backgroundColor: active ? colors.primary : colors.primarySoft }}
              >
                <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 12 }}>
                  {k === dateKey() ? 'сегодня' : WEEKDAYS_SHORT[d.getDay()]}
                </Text>
                <Text style={{ color: active ? '#fff' : colors.text, fontSize: 18, fontWeight: '600' }}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ gap: 6 }}>
        <TextField
          label="Время (необязательно)"
          value={time}
          onChangeText={setTime}
          placeholder="18:00"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        {!timeOk && <Text style={{ color: colors.accent, fontSize: 12 }}>Введите время в формате 18:00</Text>}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Приоритет</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PRIORITIES.map((p) => (
            <Chip key={p.id} label={p.label} active={priority === p.id} onPress={() => setPriority(p.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text }}>Таймер фокуса</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Включайте, если задачу нужно делать с таймером</Text>
          </View>
          <Switch value={timerOn} onValueChange={setTimerOn} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
        {timerOn && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="Pomodoro 25/5" active={timerChoice === 'pomodoro'} onPress={() => setTimerChoice('pomodoro')} />
            {[15, 25, 45, 60].map((m) => (
              <Chip key={m} label={`${m} мин`} active={timerChoice === m} onPress={() => setTimerChoice(m)} />
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Категория</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} active={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </View>
      </View>
    </FormScreen>
  );
}
