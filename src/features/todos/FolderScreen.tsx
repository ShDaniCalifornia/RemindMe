import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";
import { useKeyboardVisible } from "@/shared/hooks/useKeyboardVisible";
import { Todo, useAppStore } from "@/store/useAppStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { TodoText } from "./TodoText";

// Внутри папки: порядок меняется перетаскиванием за значок слева; тап по тексту открывает оформление
export function FolderScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardVisible();
  const { id } = useLocalSearchParams<{ id: string }>();
  const folder = useAppStore((s) => s.folders.find((f) => f.id === id));
  const allTodos = useAppStore((s) => s.todos);
  const { addTodo, toggleTodo, reorderTodos, clearDoneTodos } = useAppStore();
  const items = useMemo(
    () => allTodos.filter((t) => t.folderId === id),
    [allTodos, id],
  );
  const [text, setText] = useState("");

  if (!folder) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primaryDeep }}>Назад</Text>
        </Pressable>
        <Text style={{ color: colors.textMuted, marginTop: 16 }}>
          Папка не найдена.
        </Text>
      </SafeAreaView>
    );
  }

  const submit = () => {
    const value = text.trim();

    if (!value) return;

    const todoId = addTodo(folder.id, value);

    setText("");

    router.push({
      pathname: "/todo-edit",
      params: {
        id: todoId,
      },
    });
  };

  const confirmClear = () => {
    const n = items.filter((t) => t.done && !t.heading).length;
    if (!n) return;
    Alert.alert("Убрать выполненные?", `Будет удалено задач: ${n}.`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Убрать",
        style: "destructive",
        onPress: () => clearDoneTodos(folder.id),
      },
    ]);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <Card style={[styles.row, isActive && { borderColor: colors.primary }]}>
        <Pressable
          onPressIn={drag}
          disabled={isActive}
          hitSlop={10}
          accessibilityLabel="Перетащить"
        >
          <Ionicons name="reorder-three" size={24} color={colors.textMuted} />
        </Pressable>
        {!item.heading && (
          <Pressable
            onPress={() => toggleTodo(item.id)}
            hitSlop={8}
            accessibilityLabel="Отметить"
          >
            <Ionicons
              name={item.done ? "checkmark-circle" : "ellipse-outline"}
              size={26}
              color={item.done ? folder.color : colors.textMuted}
            />
          </Pressable>
        )}
        <Pressable
          style={{ flex: 1 }}
          onPress={() =>
            router.push({ pathname: "/todo-edit", params: { id: item.id } })
          }
        >
          <TodoText todo={item} />
        </Pressable>
      </Card>
    </ScaleDecorator>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.head}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Назад"
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <View style={[styles.dot, { backgroundColor: folder.color }]} />
          <Text
            style={[font.title, { color: colors.text, fontSize: 26, flex: 1 }]}
            numberOfLines={1}
          >
            {folder.name}
          </Text>
          <Pressable
            onPress={confirmClear}
            hitSlop={10}
            accessibilityLabel="Убрать выполненные"
          >
            <Ionicons
              name="checkmark-done"
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/folder-edit",
                params: { id: folder.id },
              })
            }
            hitSlop={10}
            accessibilityLabel="Изменить папку"
          >
            <Ionicons
              name="create-outline"
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <DraggableFlatList
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          onDragEnd={({ data }) =>
            reorderTodos(
              folder.id,
              data.map((t) => t.id),
            )
          }
          keyboardShouldPersistTaps="handled"
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              sprite="calm"
              title="В этой папке пока пусто"
              hint="Добавьте первую задачу ниже."
            />
          }
          ListFooterComponent={
            items.length > 1 ? (
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Тяните за значок слева, чтобы менять порядок. Тап по тексту
                открывает оформление.
              </Text>
            ) : null
          }
        />

        <View
          style={[
            styles.inputRow,
            {
              borderColor: colors.border,
              paddingBottom: kb ? 12 : 12 + insets.bottom,
            },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submit()}
            blurOnSubmit={false}
            returnKeyType="done"
            placeholder="Новая задача"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.card },
            ]}
          />
          <Pressable
            onPress={submit}
            style={[
              styles.round,
              {
                backgroundColor: "#2e5127",
                opacity: text.trim() ? 1 : 0.5,
              },
            ]}
          >
            <Ionicons name="arrow-up" size={22} color="#a9db9f" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
