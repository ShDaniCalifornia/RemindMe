import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { Task, useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/useTheme';

// нажатие: выполнено / нет, долгое нажатие: удалить. Значок таймера только у задач, где он включён
export function TaskRow({ task }: { task: Task }) {
  const { colors } = useTheme();
  const router = useRouter();
  const toggle = useAppStore((s) => s.toggleTask);
  const remove = useAppStore((s) => s.removeTask);
  const confirmDelete = () =>
    Alert.alert('Удалить задачу?', task.title, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => remove(task.id) },
    ]);
  const prio = task.priority === 'urgent' ? 'Срочно' : task.priority === 'important' ? 'Важно' : null;

  return (
    <Pressable onPress={() => toggle(task.id)} onLongPress={confirmDelete}>
      <Card style={styles.row}>
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={task.done ? colors.primary : colors.textMuted}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: task.done ? colors.textMuted : colors.text, textDecorationLine: task.done ? 'line-through' : 'none' }}>
            {task.title}
          </Text>
          {(task.time || prio || task.note) && (
            <View style={styles.meta}>
              {task.time && (
                <View style={styles.meta}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{task.time}</Text>
                </View>
              )}
              {prio && (
                <Text style={{ color: task.priority === 'urgent' ? colors.accent : colors.primaryDeep, fontSize: 12, fontWeight: '600' }}>
                  {prio}
                </Text>
              )}
              {task.note ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{task.note}</Text> : null}
            </View>
          )}
        </View>
        {!task.done && task.timer && (
          <Pressable
            hitSlop={10}
            onPress={() => router.push({ pathname: '/focus', params: { taskId: task.id, title: task.title, timer: String(task.timer) } })}
            accessibilityLabel="Начать фокус"
          >
            <Ionicons name="timer-outline" size={24} color={colors.primaryDeep} />
          </Pressable>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
});
