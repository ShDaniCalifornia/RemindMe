import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/useTheme';

// Список папок с задачами. Цвет папки задаёт пользователь.
export function FoldersView() {
  const { colors } = useTheme();
  const router = useRouter();
  const folders = useAppStore((s) => s.folders);
  const todos = useAppStore((s) => s.todos);

  return (
    <View style={{ gap: 10 }}>
      {folders.map((f) => {
        const items = todos.filter((t) => t.folderId === f.id && !t.heading);
        const open = items.filter((t) => !t.done).length;
        return (
          <Pressable key={f.id} onPress={() => router.push({ pathname: '/folder/[id]', params: { id: f.id } })}>
            <Card style={styles.row}>
              <View style={[styles.bar, { backgroundColor: f.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }} numberOfLines={1}>{f.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {items.length === 0 ? 'Пока пусто' : `Осталось ${open} из ${items.length}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Card>
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push('/folder-edit')} style={[styles.add, { borderColor: colors.border }]}>
        <Ionicons name="add" size={20} color={colors.primaryDeep} />
        <Text style={{ color: colors.primaryDeep }}>Новая папка</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  bar: { width: 8, height: 36, borderRadius: 4 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed' },
});
