import { AlbumPicker } from "@/shared/components/AlbumPicker";
import { Chip } from "@/shared/components/Chip";
import { MoodPicker } from "@/shared/components/MoodPicker";
import { DIARY_PROMPTS } from "@/shared/constants/diaryPrompts";
import { useKeyboardVisible } from "@/shared/hooks/useKeyboardVisible";
import {
  htmlToText,
  promptHtml,
  sanitizeHtml,
  textToHtml,
} from "@/shared/utils/richtext";
import { MOOD_LABELS, useAppStore, useTodayMood } from "@/store/useAppStore";
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
import { EditorToolbar } from "./EditorToolbar";
import {
  EMPTY_STATE,
  EditorState,
  RichEditor,
  RichEditorHandle,
} from "./RichEditor";

const hasContent = (html: string) =>
  htmlToText(html).trim().length > 0 || /<img\b/i.test(html);

export function CreateNoteScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardVisible();

  const {
    id,
    kind: kindParam,
    prompt,
    mode: modeParam,
  } = useLocalSearchParams<{
    id?: string;
    kind?: string;
    prompt?: string;
    mode?: string;
  }>();

  const { notes, addNote, updateNote, removeNote } = useAppStore();
  const todayMood = useTodayMood();

  const existing = notes.find((n) => n.id === id);

  /*
   * Важное правило:
   *
   * - новая запись без id -> редактирование;
   * - существующая запись -> чтение;
   * - mode=edit -> принудительное редактирование;
   * - mode=read -> чтение.
   */
  const mode =
    modeParam === "edit"
      ? "edit"
      : modeParam === "read"
        ? "read"
        : existing
          ? "read"
          : "edit";

  const kind: "note" | "diary" =
    existing?.kind ?? (kindParam === "diary" || prompt ? "diary" : "note");

  const [title, setTitle] = useState(existing?.title ?? "");

  const initialHtml = useRef(
    existing
      ? (existing.html ?? textToHtml(existing.text))
      : prompt
        ? promptHtml(prompt)
        : "",
  ).current;

  const htmlRef = useRef(initialHtml);
  const editor = useRef<RichEditorHandle>(null);

  const [state, setState] = useState<EditorState>(EMPTY_STATE);
  const [canSave, setCanSave] = useState(hasContent(initialHtml));

  const [albumIds, setAlbumIds] = useState<string[]>(existing?.albumIds ?? []);

  const save = () => {
    const html = sanitizeHtml(htmlRef.current);
    const text = htmlToText(html).trim();

    if (!hasContent(html)) {
      return;
    }

    const data = {
      kind,
      title: kind === "note" ? title.trim() : "",
      text,
      html,
      mood: kind === "diary" ? todayMood : null,
      albumIds,
    };

    if (existing) {
      updateNote(existing.id, data);
    } else {
      addNote(data);
    }

    router.back();
  };

  const confirmDelete = () => {
    if (!existing) {
      return;
    }

    Alert.alert("Удалить запись?", "Это действие нельзя отменить.", [
      {
        text: "Отмена",
        style: "cancel",
      },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          removeNote(existing.id);
          router.back();
        },
      },
    ]);
  };

  /*
   * ============================================================
   * РЕЖИМ ЧТЕНИЯ
   * ============================================================
   */
  if (mode === "read") {
    const header = (
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
          {kind === "diary" ? "Дневник" : "Заметка"}
        </Text>

        {existing ? (
          <Pressable
            onPress={() =>
              router.replace({
                pathname: "/create-note",
                params: {
                  id: existing.id,
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
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>
    );

    if (!existing) {
      return (
        <SafeAreaView
          edges={["top"]}
          style={[
            styles.safe,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          {header}

          <View style={styles.notFound}>
            <Text style={{ color: colors.textMuted }}>Запись не найдена.</Text>
          </View>
        </SafeAreaView>
      );
    }

    const readHtml = existing.html ?? textToHtml(existing.text ?? "");

    return (
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.safe,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {header}

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
          {kind === "note" && !!existing.title?.trim() && (
            <Text
              style={[
                styles.readTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {existing.title.trim()}
            </Text>
          )}

          {kind === "diary" && !!existing.mood && (
            <View
              style={[
                styles.readMood,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                }}
              >
                Настроение
              </Text>

              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                }}
              >
                {MOOD_LABELS[existing.mood] ?? String(existing.mood)}
              </Text>
            </View>
          )}

          <View style={styles.readEditor}>
            <RichEditor
              initialHtml={readHtml}
              readOnly
              onChange={() => {}}
              onState={() => {}}
            />
          </View>

          {albumIds.length > 0 && (
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
                Прикреплённых альбомов: {albumIds.length}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * ============================================================
   * РЕЖИМ РЕДАКТИРОВАНИЯ
   * ============================================================
   */
  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.safe,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.head}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Закрыть"
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>

          <View style={styles.headCenter}>
            <Text
              numberOfLines={1}
              style={[
                styles.headTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {kind === "diary" ? "Дневник" : "Заметка"}
            </Text>
          </View>

          {existing ? (
            <Pressable
              onPress={confirmDelete}
              hitSlop={12}
              accessibilityLabel="Удалить"
            >
              <Ionicons name="trash-outline" size={22} color={colors.accent} />
            </Pressable>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}

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

        {kind === "note" && (
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Заголовок"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          />
        )}

        {kind === "diary" && !kb && (
          <View style={styles.diaryControls}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 13,
              }}
            >
              Настроение сегодня
            </Text>

            <MoodPicker />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promptContent}
              keyboardShouldPersistTaps="handled"
            >
              {DIARY_PROMPTS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  onPress={() => editor.current?.exec("html", promptHtml(p))}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.albumBlock}>
          <AlbumPicker value={albumIds} onChange={setAlbumIds} />
        </View>

        <View style={styles.editorArea}>
          <RichEditor
            ref={editor}
            initialHtml={initialHtml}
            autoFocus={!existing && !prompt}
            placeholder={
              kind === "diary" ? "Пишите как есть…" : "Мысль, идея, список"
            }
            onChange={(h) => {
              htmlRef.current = h;
              setCanSave(hasContent(h));
            }}
            onState={setState}
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
          <EditorToolbar editor={editor} state={state} />
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

  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  headCenter: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },

  headTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  save: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },

  headerPlaceholder: {
    width: 22,
  },

  title: {
    fontSize: 24,
    fontFamily: "serif",
    paddingHorizontal: 18,
    paddingVertical: 6,
  },

  diaryControls: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 6,
  },

  promptContent: {
    gap: 8,
    paddingRight: 16,
  },

  albumBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexShrink: 0,
  },

  editorArea: {
    flex: 1,
    minHeight: 0,
  },

  toolbarContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
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
    fontSize: 30,
    lineHeight: 36,
    fontFamily: "serif",
    fontWeight: "600",
  },

  readEditor: {
    minHeight: 300,
  },

  readMood: {
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },

  readMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
