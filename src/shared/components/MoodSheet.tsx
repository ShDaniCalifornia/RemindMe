import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MOOD_LABELS, Mood } from "@/store/useAppStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

import { Button } from "./Button";
import { Chip } from "./Chip";
import { TextField } from "./TextField";

const TAGS = [
  "Работа",
  "Дом",
  "Люди",
  "Сон",
  "Здоровье",
  "Погода",
  "Ничего особенного",
];

type Props = {
  mood: Mood;
  onSave: (note: string, tags: string[]) => void;
  onClose: () => void;
};

// Быстрая запись после выбора настроения.
// Теги + короткая заметка.
// Закрытие через "Пропустить" сохраняет сам факт выбора настроения,
// потому что запись настроения создаётся до открытия этой плашки.
export function MoodSheet({ mood, onSave, onClose }: Props) {
  const { colors } = useTheme();

  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const toggle = (tag: string) => {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  return (
    <Modal
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              font.title,
              {
                color: colors.text,
                fontSize: 24,
              },
            ]}
          >
            Что-то случилось?
          </Text>

          <Text
            style={{
              color: colors.textMuted,
            }}
          >
            Настроение: {MOOD_LABELS[mood]}. Можно пару слов, а можно
            пропустить.
          </Text>

          <View style={styles.wrap}>
            {TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                active={tags.includes(tag)}
                onPress={() => toggle(tag)}
              />
            ))}
          </View>

          <TextField
            value={note}
            onChangeText={setNote}
            placeholder="Например, тяжёлый созвон"
            maxLength={160}
            autoFocus={false}
          />

          <View style={styles.actions}>
            <Button
              title="Сохранить"
              onPress={() => onSave(note.trim(), tags)}
            />

            <Button title="Пропустить" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  sheet: {
    minHeight: 390,
    maxHeight: 390,

    padding: 20,

    gap: 14,

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    borderWidth: StyleSheet.hairlineWidth,
  },

  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  actions: {
    gap: 8,
    marginTop: "auto",
  },
});
