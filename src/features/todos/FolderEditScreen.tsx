import { Button } from "@/shared/components/Button";
import { ColorPicker, Swatch } from "@/shared/components/ColorPicker";
import { FormScreen } from "@/shared/components/FormScreen";
import { TextField } from "@/shared/components/TextField";
import { FOLDER_COLORS } from "@/shared/constants/palettes";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export function FolderEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { folders, customColors, addFolder, updateFolder, removeFolder } =
    useAppStore();
  const existing = folders.find((f) => f.id === id);

  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.color ?? FOLDER_COLORS[0]);
  const [picker, setPicker] = useState(false);

  const save = () => {
    if (existing) updateFolder(existing.id, { name: name.trim(), color });
    else addFolder(name.trim(), color);
    router.back();
  };

  const confirmDelete = () =>
    Alert.alert("Удалить папку?", "Все задачи внутри тоже будут удалены.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          removeFolder(existing!.id);
          router.dismissAll?.();
          router.back();
        },
      },
    ]);

  return (
    <FormScreen
      title={existing ? "Папка" : "Новая папка"}
      footer={
        <>
          <Button title="Сохранить" onPress={save} disabled={!name.trim()} />
          {existing && folders.length > 1 && (
            <Button
              title="Удалить папку"
              variant="danger"
              onPress={confirmDelete}
            />
          )}
        </>
      }
    >
      <TextField
        label="Название"
        value={name}
        onChangeText={setName}
        placeholder="Например, Дом"
        autoFocus={!existing}
      />

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          Цвет папки
        </Text>
        <View style={styles.wrap}>
          {FOLDER_COLORS.map((c) => (
            <Swatch
              key={c}
              color={c}
              selected={color === c}
              onPress={() => setColor(c)}
            />
          ))}
          {customColors.map((c) => (
            <Swatch
              key={c}
              color={c}
              selected={color === c}
              onPress={() => setColor(c)}
            />
          ))}
          <Pressable
            onPress={() => setPicker(true)}
            style={[styles.plus, { borderColor: colors.border }]}
            accessibilityLabel="Свой цвет"
          >
            <Text style={{ color: colors.primaryDeep, fontSize: 20 }}>+</Text>
          </Pressable>
        </View>
      </View>

      {picker && (
        <ColorPicker
          title="Цвет папки"
          presets={FOLDER_COLORS}
          value={color}
          onClose={() => setPicker(false)}
          onPick={(c) => {
            if (c) setColor(c);
            setPicker(false);
          }}
        />
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  plus: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
