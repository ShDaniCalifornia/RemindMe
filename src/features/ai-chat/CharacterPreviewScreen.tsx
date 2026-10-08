import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { ALL_STATES, CharacterState } from '@/shared/components/characterAssets';
import { useTheme } from '@/theme/useTheme';
import { font } from '@/theme/tokens';

// Отладочный экран: смотрим все состояния персонажа и переключаем их
export function CharacterPreviewScreen() {
  const { colors } = useTheme();
  const [state, setState] = useState<CharacterState>('calm');
  return (
    <Screen>
      <Text style={[font.title, { color: colors.text, paddingTop: 8 }]}>Персонаж</Text>
      <View style={{ alignItems: 'center' }}>
        <CharacterAvatar state={state} size={220} />
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>{state}</Text>
      </View>
      <View style={styles.chips}>
        {ALL_STATES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setState(s)}
            style={[styles.chip, { backgroundColor: state === s ? colors.primary : colors.primarySoft }]}
          >
            <Text style={{ color: state === s ? '#fff' : colors.text }}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {ALL_STATES.map((s) => (
          <CharacterAvatar key={s} state={s} size={72} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
});
