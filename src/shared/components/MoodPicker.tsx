import { Pressable, StyleSheet, Text, View } from "react-native";

import { Mood, useAppStore, useTodayMood } from "@/store/useAppStore";

import { CharacterAvatar, CharacterState } from "./CharacterAvatar";

import { useTheme } from "@/theme/useTheme";

// От плохого к хорошему:
//
// Не очень
// Тревожно
// Нет сил
// Спокойно
// Счастливо
//
// И персонажи идут в том же порядке:
// worried → shy → sleep → calm → happy.

const moods: {
  id: Mood;
  label: string;
  sprite: CharacterState;
}[] = [
  {
    id: "low",
    label: "Не очень",
    sprite: "worried",
  },

  {
    id: "anxious",
    label: "Тревожно",
    sprite: "shy",
  },

  {
    id: "tired",
    label: "Нет сил",
    sprite: "sleep",
  },

  {
    id: "calm",
    label: "Спокойно",
    sprite: "calm",
  },

  {
    id: "happy",
    label: "Счастливо",
    sprite: "happy",
  },
];

export function MoodPicker({ onPick }: { onPick?: (mood: Mood) => void }) {
  const { colors } = useTheme();

  const mood = useTodayMood();

  const setMood = useAppStore((s) => s.setMood);

  return (
    <View style={styles.row}>
      {moods.map((item) => {
        const active = mood === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => (onPick ? onPick(item.id) : setMood(item.id))}
            style={styles.item}
            accessibilityLabel={item.label}
          >
            <View
              style={[
                styles.ring,
                {
                  borderColor: active ? colors.accent : "transparent",
                },
              ]}
            >
              <CharacterAvatar state={item.sprite} size={48} />
            </View>

            <Text
              style={{
                color: active ? colors.text : colors.textMuted,

                fontSize: 11,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  item: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  ring: {
    borderWidth: 2,
    borderRadius: 30,
    padding: 2,
  },
});
