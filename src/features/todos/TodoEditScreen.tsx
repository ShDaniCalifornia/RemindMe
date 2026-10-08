import { AlbumPicker } from "@/shared/components/AlbumPicker";
import { Button } from "@/shared/components/Button";
import { Chip } from "@/shared/components/Chip";
import { useKeyboardVisible } from "@/shared/hooks/useKeyboardVisible";
import { sanitizeHtml } from "@/shared/utils/richtext";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { EditorToolbar } from "../notes/EditorToolbar";
import {
  EMPTY_STATE,
  EditorState,
  RichEditor,
  RichEditorHandle,
} from "../notes/RichEditor";

export function TodoEditScreen() {
  const { id, mode: modeParam } = useLocalSearchParams<{
    id?: string;
    mode?: string;
  }>();

  const { colors } = useTheme();
  const router = useRouter();

  const todo = useAppStore((state) =>
    state.todos.find((item) => item.id === id),
  );

  /*
   * Существующая задача по умолчанию читается.
   * Новая задача без id — редактируется.
   */
  const mode =
    modeParam === "edit"
      ? "edit"
      : modeParam === "read"
        ? "read"
        : todo
          ? "read"
          : "edit";

  if (!todo) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.missing}>
          <Text
            style={{
              color: colors.textMuted,
            }}
          >
            Задача не найдена.
          </Text>

          <Button title="Назад" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return mode === "read" ? (
    <TodoReadScreen todoId={todo.id} />
  ) : (
    <TodoEditContent todoId={todo.id} />
  );
}

function TodoReadScreen({ todoId }: { todoId: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todo = useAppStore((state) =>
    state.todos.find((item) => item.id === todoId),
  );

  const toggleTodo = useAppStore((state) => state.toggleTodo);

  if (!todo) {
    return null;
  }

  const detailsHtml = todo.detailsHtml ?? "";

  const attachedCount = todo.albumIds?.length ?? 0;

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={["top"]}
    >
      <View style={styles.readHeader}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Закрыть"
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>

        <Text
          numberOfLines={1}
          style={[
            styles.readHeaderTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Задача
        </Text>

        <Pressable
          onPress={() =>
            router.replace({
              pathname: "/todo-edit",
              params: {
                id: todo.id,
                mode: "edit",
              },
            })
          }
          hitSlop={12}
          accessibilityLabel="Редактировать"
        >
          <Ionicons
            name="create-outline"
            size={22}
            color={colors.primaryDeep}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.readScroll}
        contentContainerStyle={[
          styles.readContent,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.readTitle,
            {
              color: todo.done ? colors.textMuted : colors.text,
              textDecorationLine: todo.done ? "line-through" : "none",
            },
          ]}
        >
          {todo.text}
        </Text>

        {!!detailsHtml && (
          <View style={styles.readEditor}>
            <RichEditor
              initialHtml={detailsHtml}
              readOnly
              onChange={() => {}}
              onState={() => {}}
            />
          </View>
        )}

        {attachedCount > 0 && (
          <View style={styles.readMeta}>
            <Ionicons
              name="images-outline"
              size={17}
              color={colors.textMuted}
            />

            <Text
              style={{
                color: colors.textMuted,
                fontSize: 13,
              }}
            >
              Прикреплённых альбомов: {attachedCount}
            </Text>
          </View>
        )}

        <Button
          title={todo.done ? "Вернуть в работу" : "Отметить выполненной"}
          variant={todo.done ? "ghost" : "primary"}
          onPress={() => toggleTodo(todo.id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function TodoEditContent({ todoId }: { todoId: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardVisible();

  const todo = useAppStore((state) =>
    state.todos.find((item) => item.id === todoId),
  );

  const folders = useAppStore((state) => state.folders);

  const updateTodo = useAppStore((state) => state.updateTodo);

  const removeTodo = useAppStore((state) => state.removeTodo);

  const editor = useRef<RichEditorHandle | null>(null);

  const initialHtml = useRef(todo?.detailsHtml ?? "").current;

  const htmlRef = useRef(initialHtml);

  const [editorState, setEditorState] = useState<EditorState>(EMPTY_STATE);

  const [title, setTitle] = useState(todo?.text ?? "");

  const [albumIds, setAlbumIds] = useState<string[]>(todo?.albumIds ?? []);

  const [folderId, setFolderId] = useState(todo?.folderId ?? "");

  if (!todo) {
    return null;
  }

  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) {
      return;
    }

    updateTodo(todo.id, {
      text: title.trim(),
      detailsHtml: sanitizeHtml(htmlRef.current),
      folderId,
      albumIds,
    });

    router.back();
  };

  const confirmDelete = () => {
    Alert.alert("Удалить задачу?", "Это действие нельзя отменить.", [
      {
        text: "Отмена",
        style: "cancel",
      },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          removeTodo(todo.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.editHeader}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Закрыть"
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>

          <Text
            style={[
              styles.editHeaderTitle,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            Задача
          </Text>

          <Pressable
            onPress={confirmDelete}
            hitSlop={12}
            accessibilityLabel="Удалить"
          >
            <Ionicons name="trash-outline" size={22} color={colors.accent} />
          </Pressable>

          <Pressable
            onPress={save}
            disabled={!canSave}
            style={[
              styles.save,
              {
                backgroundColor: colors.primary,
                opacity: canSave ? 1 : 0.45,
              },
            ]}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "600",
              }}
            >
              Готово
            </Text>
          </Pressable>
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Название задачи"
          placeholderTextColor={colors.textMuted}
          returnKeyType="next"
          blurOnSubmit
          onSubmitEditing={() => editor.current?.focus()}
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        />

        {!kb && (
          <View style={styles.metaBlock}>
            {folders.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.folderRow}
              >
                {folders.map((folder) => (
                  <Chip
                    key={folder.id}
                    label={folder.name}
                    active={folderId === folder.id}
                    onPress={() => setFolderId(folder.id)}
                  />
                ))}
              </ScrollView>
            )}

            <AlbumPicker value={albumIds} onChange={setAlbumIds} />
          </View>
        )}

        <View style={styles.descriptionHeader}>
          <Text
            style={[
              styles.descriptionLabel,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Описание
          </Text>
        </View>

        <View
          style={[
            styles.descriptionCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <RichEditor
            ref={editor}
            initialHtml={initialHtml}
            placeholder="Описание, шаги, список…"
            onChange={(h) => {
              htmlRef.current = h;
            }}
            onState={setEditorState}
          />
        </View>

        <View
          style={[
            styles.toolbarContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: kb ? 0 : insets.bottom,
            },
          ]}
        >
          <EditorToolbar editor={editor} state={editorState} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
  },

  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  readHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  readHeaderTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
    fontSize: 17,
    fontWeight: "600",
  },

  readScroll: {
    flex: 1,
  },

  readContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 18,
  },

  readTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: "serif",
    fontWeight: "600",
  },

  readEditor: {
    minHeight: 280,
  },

  readMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  editHeaderTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
  },

  save: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },

  title: {
    fontSize: 24,
    fontFamily: "serif",
    paddingHorizontal: 18,
    paddingVertical: 6,
  },

  metaBlock: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
    flexShrink: 0,
  },

  folderRow: {
    gap: 8,
    paddingRight: 16,
  },

  descriptionHeader: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 6,
    flexShrink: 0,
  },

  descriptionLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  descriptionCard: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  toolbarContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
});
