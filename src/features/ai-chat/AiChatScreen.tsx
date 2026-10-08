import {
  CharacterAvatar,
  CharacterState,
} from "@/shared/components/CharacterAvatar";
import { useKeyboardVisible } from "@/shared/hooks/useKeyboardVisible";
import { formatDayLong } from "@/shared/utils/date";
import { parseQuickTask } from "@/shared/utils/quickParse";
import { MOOD_LABELS, useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
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

import { QUICK_CHIPS } from "./engine/content";
import { crisisReply, helpMessage, isCrisis } from "./engine/crisis";
import {
  createMem,
  greeting,
  moodReply,
  planIntro,
  reply,
  stressReply,
  thoughtsReply,
} from "./engine/engine";
import { HELPLINES } from "./engine/helplines";
import { norm } from "./engine/text";
import type { BotReply, ChatAction, ChipDef } from "./engine/types";
import { useChatContext } from "./useChatContext";

/*
 * ВАЖНО:
 * Здесь используется useUiStore.
 * Если он у тебя импортируется из другого файла,
 * замени путь ниже на свой существующий путь.
 */
import { useUiStore } from "@/store/useUiStore";

type Msg = {
  id: string;
  from: "me" | "ai";
  text: string;
  crisis?: boolean;
};

const mid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function AiChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardVisible();

  const ctx = useChatContext();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const mem = useRef(createMem()).current;
  const listRef = useRef<FlatList<Msg>>(null);

  const alive = useRef(true);

  const poseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const runRef = useRef<(a: ChatAction) => void>(() => {});

  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [pose, setPose] = useState<CharacterState>("calm");

  /*
   * Сохраняем чат в useUiStore.
   * Поэтому при закрытии экрана сообщения не исчезают.
   */
  const chatMessages = useUiStore((s) => s.chatMessages);
  const setChatMessages = useUiStore((s) => s.setChatMessages);

  const storedChips = useUiStore((s) => s.chatChips);
  const setChatChips = useUiStore((s) => s.setChatChips);

  const chatStarted = useUiStore((s) => s.chatStarted);
  const setChatStarted = useUiStore((s) => s.setChatStarted);

  /*
   * Локальное состояние инициализируется
   * сохранёнными сообщениями.
   */
  const [msgs, setMsgsLocal] = useState<Msg[]>(chatMessages);

  const [chips, setChipsLocal] = useState<ChipDef[]>(storedChips);

  /*
   * Если store изменился до монтирования/при возврате,
   * синхронизируем локальное состояние.
   */
  useEffect(() => {
    setMsgsLocal(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    setChipsLocal(storedChips);
  }, [storedChips]);

  /*
   * Очистка таймеров.
   */
  useEffect(
    () => () => {
      alive.current = false;

      if (poseTimer.current) {
        clearTimeout(poseTimer.current);
      }
    },
    [],
  );

  /*
   * Добавить ответ помощницы.
   */
  const pushBot = useCallback((r: BotReply) => {
    if (!alive.current) return;

    if (r.text) {
      setMsgs((messages) => [
        ...messages,
        {
          id: mid(),
          from: "ai",
          text: r.text,
          crisis: r.crisis,
        },
      ]);
    }

    setChips(r.chips ?? []);

    setPose(r.pose ?? "calm");

    if (poseTimer.current) {
      clearTimeout(poseTimer.current);
    }

    if (r.pose && r.pose !== "calm") {
      poseTimer.current = setTimeout(() => setPose("calm"), 5000);
    }

    if (r.action) {
      const action = r.action;

      setTimeout(
        () => {
          if (alive.current) {
            runRef.current(action);
          }
        },
        r.text ? 650 : 0,
      );
    }
  }, []);

  /*
   * Первое приветствие.
   *
   * ВАЖНО:
   * Оно появляется только один раз,
   * а не каждый раз после возврата в чат.
   */
  useEffect(() => {
    if (!chatStarted) {
      setChatStarted(true);

      pushBot(greeting(ctxRef.current, mem));
    }
  }, []);

  /*
   * Автоматический скролл вниз.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    }, 60);

    return () => clearTimeout(timer);
  }, [msgs, kb, typing, chips]);

  /*
   * Планирование дня.
   */
  const planStep = (raw: string): BotReply => {
    if (/^(?:готово|все|хватит|стоп|достаточно)/.test(norm(raw))) {
      mem.mode = "talk";

      return {
        intent: "plan_done",
        pose: "happy",
        text: "Хорошо, всё записано. План ждёт тебя во вкладке «Планы».",
        chips: [
          {
            label: "Открыть планы",
            action: {
              type: "route",
              path: "/plans",
            },
          },
        ],
      };
    }

    const p = parseQuickTask(raw);

    useAppStore.getState().addTask({
      title: p.title,
      date: p.date,
      time: p.time,
      category: p.category,
      priority: p.priority,
    });

    return {
      intent: "plan_add",
      pose: "thinking",
      text:
        `Добавила: «${p.title}», ` +
        `${formatDayLong(p.date).toLowerCase()}` +
        `${
          p.time ? ` в ${p.time}` : ""
        }. Что ещё? Когда закончишь, напиши «готово».`,
      chips: [
        {
          label: "Готово",
          action: {
            type: "say",
            text: "готово",
          },
        },
      ],
    };
  };

  /*
   * Ответ на сообщение пользователя.
   */
  const respond = (raw: string) => {
    setTyping(true);
    setChips([]);

    setPose("thinking");

    const delay = 450 + Math.min(raw.length * 12, 650);

    setTimeout(() => {
      if (!alive.current) return;

      setTyping(false);

      let r: BotReply;

      if (isCrisis(raw)) {
        r = crisisReply();
      } else if (mem.mode === "plan") {
        r = planStep(raw);
      } else {
        r = reply(raw, ctxRef.current, mem);
      }

      pushBot(r);
    }, delay);
  };

  /*
   * Отправка текста.
   */
  const sendText = (raw: string) => {
    const value = raw.trim();

    if (!value || typing) {
      return;
    }

    setMsgs((messages) => [
      ...messages,
      {
        id: mid(),
        from: "me",
        text: value,
      },
    ]);

    setText("");

    respond(value);
  };

  /*
   * Единая функция изменения сообщений.
   *
   * Здесь сообщение одновременно:
   * 1. меняется на экране;
   * 2. сохраняется в useUiStore.
   */
  const setMsgs = useCallback(
    (next: Msg[] | ((messages: Msg[]) => Msg[])) => {
      setMsgsLocal((current) => {
        const value = typeof next === "function" ? next(current) : next;

        setChatMessages(value);

        return value;
      });
    },
    [setChatMessages],
  );

  /*
   * Единая функция изменения кнопок.
   */
  const setChips = useCallback(
    (next: ChipDef[]) => {
      setChipsLocal(next);

      setChatChips(next);
    },
    [setChatChips],
  );

  /*
   * Выполнение действий чата.
   */
  runRef.current = (action: ChatAction) => {
    switch (action.type) {
      case "say":
        sendText(action.text);
        break;

      case "mood":
        useAppStore.getState().addMoodEntry({
          mood: action.mood,
        });

        setMsgs((messages) => [
          ...messages,
          {
            id: mid(),
            from: "me",
            text: MOOD_LABELS[action.mood],
          },
        ]);

        setChips([]);

        setTyping(true);

        setTimeout(() => {
          if (!alive.current) return;

          setTyping(false);

          pushBot(
            moodReply(
              action.mood,
              {
                ...ctxRef.current,
                mood: action.mood,
                moodLabel: MOOD_LABELS[action.mood],
              },
              mem,
            ),
          );
        }, 500);

        break;

      case "route":
        router.push(action.path as never);
        break;

      case "game":
        router.push("/anti-stress");
        break;

      case "breathing":
        router.push("/breathing");
        break;

      case "focus":
        router.push("/focus");
        break;

      case "diary":
        router.push({
          pathname: "/create-note",
          params: {
            kind: "diary",
            prompt: action.prompt ?? "",
          },
        });
        break;

      case "plan":
        mem.mode = "plan";

        pushBot(planIntro());

        break;

      case "thoughts":
        pushBot(thoughtsReply());
        break;

      case "stress":
        pushBot(stressReply());
        break;

      case "help":
        pushBot(helpMessage());
        break;
    }
  };

  /*
   * Нажатие на кнопку.
   */
  const chipPress = (chip: ChipDef) => {
    if (chip.say) {
      setChips([]);

      setMsgs((messages) => [
        ...messages,

        {
          id: mid(),
          from: "me",
          text: chip.label,
        },

        {
          id: mid(),
          from: "ai",
          text: chip.say!,
        },
      ]);

      setPose(chip.pose ?? "calm");

      if (poseTimer.current) {
        clearTimeout(poseTimer.current);
      }

      poseTimer.current = setTimeout(() => setPose("calm"), 5000);

      setTimeout(() => {
        if (alive.current) {
          runRef.current(chip.action);
        }
      }, 900);
    } else {
      if (chip.pose) {
        setPose(chip.pose);
      }

      runRef.current(chip.action);
    }
  };

  /*
   * Кнопка чата.
   */
  const ActionChip = ({ chip, quick }: { chip: ChipDef; quick?: boolean }) => (
    <Pressable
      onPress={() => chipPress(chip)}
      style={[
        styles.chip,

        quick
          ? {
              borderColor: colors.border,
              borderWidth: 1,
              backgroundColor: "transparent",
            }
          : {
              backgroundColor: colors.primarySoft,
            },
      ]}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
        }}
      >
        {chip.label}
      </Text>
    </Pressable>
  );

  /*
   * Кнопки помощи.
   */
  const helpLinks = [
    {
      label: HELPLINES.emergencyLabel,

      onPress: () => Linking.openURL(`tel:${HELPLINES.emergencyNumber}`),
    },

    {
      label: HELPLINES.directoryLabel,

      onPress: () => Linking.openURL(HELPLINES.directoryUrl),
    },

    ...HELPLINES.extra.map((item) => ({
      label: item.label,

      onPress: () =>
        Linking.openURL(item.tel ? `tel:${item.tel}` : (item.url ?? "")),
    })),
  ];

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {/* HEADER */}
        <View style={styles.head}>
          <Pressable
            onPress={() => pushBot(helpMessage())}
            style={[
              styles.helpPill,
              {
                borderColor: colors.accent,
              },
            ]}
            accessibilityLabel="Срочная помощь"
          >
            <Ionicons name="heart-outline" size={14} color={colors.accent} />

            <Text
              style={{
                color: colors.accent,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Помощь
            </Text>
          </Pressable>

          <View
            style={{
              flex: 1,
              alignItems: "center",
            }}
          >
            <CharacterAvatar state={typing ? "thinking" : pose} size={64} />

            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {typing ? "печатает…" : "на связи"}
            </Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Закрыть"
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        <Text
          style={{
            color: colors.textMuted,
            fontSize: 11,
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          Помощник по сценариям: не человек и не специалист. Разговор остаётся
          на вашем телефоне.
        </Text>

        {/* MESSAGES */}
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(message) => message.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 16,
            gap: 8,
          }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,

                item.from === "me"
                  ? {
                      alignSelf: "flex-end",
                      backgroundColor: colors.primary,
                    }
                  : {
                      alignSelf: "flex-start",
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: StyleSheet.hairlineWidth,
                    },
              ]}
            >
              <Text
                style={{
                  color: item.from === "me" ? "#fff" : colors.text,
                }}
              >
                {item.text}
              </Text>

              {item.crisis && (
                <View
                  style={{
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {helpLinks.map((link) => (
                    <Pressable
                      key={link.label}
                      onPress={link.onPress}
                      style={[
                        styles.helpBtn,
                        {
                          borderColor: colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.accent,
                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >
                        {link.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        />

        {/* CHIPS */}
        {!typing && (
          <View style={styles.chipsWrap}>
            {/* Динамический ряд */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chipsContent}
            >
              {chips.map((chip) => (
                <ActionChip key={`dynamic-${chip.label}`} chip={chip} />
              ))}
            </ScrollView>

            {/* Базовый ряд */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chipsContent}
            >
              {QUICK_CHIPS.map((chip) => (
                <ActionChip key={`quick-${chip.label}`} chip={chip} quick />
              ))}
            </ScrollView>
          </View>
        )}

        {/* INPUT */}
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
            onSubmitEditing={() => sendText(text)}
            placeholder="Напишите сообщение"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.card,
              },
            ]}
          />

          <Pressable
            onPress={() => sendText(text)}
            style={[
              styles.send,
              {
                backgroundColor: colors.accent,
                opacity: text.trim() ? 1 : 0.5,
              },
            ]}
          >
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  helpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 4,
  },

  bubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 18,
  },

  helpBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  chipsRow: {
    flexGrow: 0,
    paddingVertical: 8,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  chipsWrap: {
    gap: 6,
    paddingVertical: 8,
  },

  chipsContent: {
    gap: 8,
    paddingHorizontal: 12,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },

  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
