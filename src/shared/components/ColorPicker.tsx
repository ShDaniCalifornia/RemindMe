import { hslToHex, normalizeHex, onColor } from "@/shared/utils/color";
import { useAppStore } from "@/store/useAppStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "./Button";

export function Swatch({
  color,
  selected,
  onPress,
  onLongPress,
  size = 34,
}: {
  color: string;
  selected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: selected ? 3 : StyleSheet.hairlineWidth,
        borderColor: selected ? colors.text : colors.border,
      }}
    />
  );
}

const HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const LIGHTS = [88, 74, 60, 46, 32];
const GRAYS = [0, 15, 30, 45, 60, 75, 90, 100];

type Props = {
  title: string;
  presets: string[];
  value?: string | null;
  noneLabel?: string; // если задано, появляется кнопка «без цвета» (вернёт null)
  onPick: (color: string | null) => void;
  onClose: () => void;
};

// Стандартные цвета, свои сохранённые цвета (долгое нажатие удаляет) и любой цвет через сетку или hex
export function ColorPicker({
  title,
  presets,
  value,
  noneLabel,
  onPick,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const custom = useAppStore((s) => s.customColors);
  const addCustom = useAppStore((s) => s.addCustomColor);
  const removeCustom = useAppStore((s) => s.removeCustomColor);
  const [draft, setDraft] = useState(value ?? presets[0]);
  const [hex, setHex] = useState(value ?? presets[0]);

  const choose = (c: string) => {
    setDraft(c);
    setHex(c);
  };
  const confirmRemove = (c: string) =>
    Alert.alert("Удалить цвет из «Моих цветов»?", undefined, [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: () => removeCustom(c) },
    ]);

  const label = (t: string) => (
    <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t}</Text>
  );

  return (
    <Modal
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <View style={styles.head}>
          <Text
            style={[font.title, { color: colors.text, fontSize: 22, flex: 1 }]}
          >
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{ gap: 14, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {label("Стандартные")}
          <View style={styles.wrap}>
            {noneLabel && (
              <Pressable
                onPress={() => onPick(null)}
                style={[styles.none, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontSize: 12 }}>
                  {noneLabel}
                </Text>
              </Pressable>
            )}
            {presets.map((c) => (
              <Swatch
                key={c}
                color={c}
                selected={draft === c}
                onPress={() => onPick(c)}
              />
            ))}
          </View>

          {label("Мои цвета")}
          <View style={styles.wrap}>
            {custom.length === 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Пока нет. Выберите цвет ниже и нажмите «Сохранить в мои цвета».
              </Text>
            )}
            {custom.map((c) => (
              <Swatch
                key={c}
                color={c}
                selected={draft === c}
                onPress={() => onPick(c)}
                onLongPress={() => confirmRemove(c)}
              />
            ))}
          </View>

          {label("Любой цвет")}
          <View style={{ gap: 4 }}>
            {LIGHTS.map((l) => (
              <View key={l} style={styles.row}>
                {HUES.map((h) => {
                  const c = hslToHex(h, 70, l);
                  return (
                    <Swatch
                      key={h}
                      color={c}
                      size={22}
                      selected={draft === c}
                      onPress={() => choose(c)}
                    />
                  );
                })}
              </View>
            ))}
            <View style={styles.row}>
              {GRAYS.map((l) => {
                const c = hslToHex(0, 0, l);
                return (
                  <Swatch
                    key={l}
                    color={c}
                    size={22}
                    selected={draft === c}
                    onPress={() => choose(c)}
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.preview,
                { backgroundColor: draft, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: onColor(draft), fontWeight: "600" }}>
                Аa
              </Text>
            </View>
            <TextInput
              value={hex}
              onChangeText={(t) => {
                setHex(t);
                const n = normalizeHex(t);
                if (n) setDraft(n);
              }}
              autoCapitalize="characters"
              maxLength={7}
              placeholder="#RRGGBB"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.hex,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Button title="Применить" onPress={() => onPick(draft)} />
            <Button
              title="Сохранить в мои цвета"
              variant="ghost"
              onPress={() => addCustom(draft)}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    maxHeight: "86%",
    padding: 20,
    gap: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  head: { flexDirection: "row", alignItems: "center" },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  row: { flexDirection: "row", gap: 4, alignItems: "center" },
  none: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  preview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  hex: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
});
