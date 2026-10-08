import { StyleSheet, Text, View } from 'react-native';
import { CharacterAvatar, CharacterState } from './CharacterAvatar';
import { useTheme } from '@/theme/useTheme';

export function EmptyState({ title, hint, sprite = 'calm' }: { title: string; hint: string; sprite?: CharacterState }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <CharacterAvatar state={sprite} size={110} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  title: { fontSize: 17, fontWeight: '600' },
});
