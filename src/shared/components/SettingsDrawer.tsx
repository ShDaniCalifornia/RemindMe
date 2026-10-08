import { ThemePref, useAppStore } from "@/store/useAppStore";

import { useUiStore } from "@/store/useUiStore";

import {
  BACKGROUNDS,
  BackgroundId,
  DARK_BACKGROUNDS,
  DarkBackgroundId,
} from "@/theme/colors";

import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

import { usePathname } from "expo-router";
import { useEffect, useState } from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "./Button";
import { CharacterAvatar } from "./CharacterAvatar";
import { Chip } from "./Chip";
import { TextField } from "./TextField";

const EDGE_WIDTH = 54;

const TAB_ROUTES = ["/", "/habits", "/notes", "/plans"];

const themes: {
  id: ThemePref;
  label: string;
}[] = [
  {
    id: "system",
    label: "Системная",
  },
  {
    id: "light",
    label: "Светлая",
  },
  {
    id: "dark",
    label: "Тёмная",
  },
];

export function SettingsDrawer() {
  const { colors, isDark } = useTheme();

  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const drawerWidth = Math.min(330, width * 0.84);

  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const setDrawer = useUiStore((s) => s.setDrawer);

  const {
    themePref,
    setThemePref,

    backgroundPref,
    setBackground,

    darkBackgroundPref,
    setDarkBackground,

    name,
    setName,

    notifications,
    setNotifications,

    resetData,
  } = useAppStore();

  /**
   * Какая палитра сейчас раскрыта.
   *
   * null   — закрыты обе
   * light  — открыта светлая
   * dark   — открыта тёмная
   */
  const [openPalette, setOpenPalette] = useState<"light" | "dark" | null>(null);

  /**
   * Положение панели.
   */
  const translateX = useSharedValue(-drawerWidth);

  useEffect(() => {
    translateX.value = withTiming(drawerOpen ? 0 : -drawerWidth, {
      duration: 220,
    });
  }, [drawerOpen, drawerWidth, translateX]);

  /**
   * Открытие панели свайпом справа.
   */
  const openGesture = Gesture.Pan()
    .failOffsetY([-25, 25])
    .activeOffsetX(10)
    .onUpdate((event) => {
      const nextX = -drawerWidth + Math.max(0, event.translationX);

      translateX.value = Math.min(Math.max(nextX, -drawerWidth), 0);
    })
    .onEnd((event) => {
      const shouldOpen =
        translateX.value > -drawerWidth * 0.55 || event.velocityX > 600;

      runOnJS(setDrawer)(shouldOpen);

      translateX.value = withTiming(shouldOpen ? 0 : -drawerWidth, {
        duration: 200,
      });
    });

  /**
   * Закрытие панели свайпом влево.
   */
  const closeGesture = Gesture.Pan()
    .failOffsetY([-25, 25])
    .activeOffsetX(-10)
    .onUpdate((event) => {
      const nextX = Math.min(0, event.translationX);

      translateX.value = Math.max(nextX, -drawerWidth);
    })
    .onEnd((event) => {
      const shouldClose =
        translateX.value < -drawerWidth * 0.4 || event.velocityX < -600;

      if (shouldClose) {
        runOnJS(setDrawer)(false);

        translateX.value = withTiming(-drawerWidth, {
          duration: 200,
        });
      } else {
        translateX.value = withTiming(0, {
          duration: 200,
        });

        runOnJS(setDrawer)(true);
      }
    });

  /**
   * Анимация панели.
   */
  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
    ],
  }));

  /**
   * Затемнение.
   */
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-drawerWidth, 0], [0, 0.42]),
  }));

  const closeDrawer = () => {
    setDrawer(false);

    translateX.value = withTiming(-drawerWidth, {
      duration: 200,
    });
  };

  const confirmReset = () => {
    Alert.alert(
      "Сбросить данные?",
      "Привычки, задачи и заметки будут удалены с этого устройства.",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Сбросить",
          style: "destructive",
          onPress: resetData,
        },
      ],
    );
  };

  const showEdgeGesture = !drawerOpen && pathname === "/";

  /**
   * Текущий выбранный светлый фон.
   */
  const selectedLight =
    backgroundPref in BACKGROUNDS ? (backgroundPref as BackgroundId) : "beige";

  /**
   * Текущий выбранный тёмный фон.
   */
  const selectedDark =
    darkBackgroundPref in DARK_BACKGROUNDS
      ? (darkBackgroundPref as DarkBackgroundId)
      : "graphite";

  /**
   * Открывает одну палитру и закрывает другую.
   */
  const togglePalette = (palette: "light" | "dark") => {
    setOpenPalette((current) => (current === palette ? null : palette));
  };

  return (
    <>
      {/* =========================================================
          ЗОНА СВАЙПА
          ========================================================= */}

      {showEdgeGesture && (
        <GestureDetector gesture={openGesture}>
          <View
            pointerEvents="box-only"
            style={[
              styles.edgeGesture,
              {
                width: EDGE_WIDTH,
              },
            ]}
          />
        </GestureDetector>
      )}

      {/* =========================================================
          ПАНЕЛЬ
          ========================================================= */}

      <View
        pointerEvents={drawerOpen ? "auto" : "none"}
        style={StyleSheet.absoluteFill}
      >
        {/* Затемнение */}

        <Animated.View
          pointerEvents={drawerOpen ? "auto" : "none"}
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            backdropAnimatedStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        {/* Панель */}

        <GestureDetector gesture={closeGesture}>
          <Animated.View
            style={[
              styles.panel,
              {
                width: drawerWidth,
                backgroundColor: colors.background,
                borderColor: colors.border,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
              },
              panelAnimatedStyle,
            ]}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* =====================================================
                  ЗАГОЛОВОК
                  ===================================================== */}

              <View style={styles.header}>
                <Text
                  style={[
                    font.title,
                    {
                      color: colors.text,
                      fontSize: 26,
                    },
                  ]}
                >
                  Настройки
                </Text>

                <Pressable
                  onPress={closeDrawer}
                  hitSlop={12}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Закрыть настройки"
                >
                  <Text
                    style={[
                      styles.closeText,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              {/* =====================================================
                  ПРОФИЛЬ
                  ===================================================== */}

              <View style={styles.section}>
                <View style={styles.avatarContainer}>
                  <CharacterAvatar state="loving" size={84} />
                </View>

                <TextField
                  label="Как к вам обращаться"
                  value={name}
                  onChangeText={setName}
                  placeholder="Имя"
                />

                <Button
                  title="Войти в аккаунт (скоро)"
                  onPress={() => {}}
                  variant="ghost"
                  disabled
                />
              </View>

              {/* =====================================================
                  ТЕМА
                  ===================================================== */}

              <View style={styles.section}>
                <Text
                  style={[
                    font.h2,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Тема
                </Text>

                <View style={styles.wrap}>
                  {themes.map((theme) => (
                    <Chip
                      key={theme.id}
                      label={theme.label}
                      active={themePref === theme.id}
                      onPress={() => setThemePref(theme.id)}
                    />
                  ))}
                </View>
              </View>

              {/* =====================================================
                  ЦВЕТ ФОНА
                  ===================================================== */}

              <View style={styles.section}>
                <Text
                  style={[
                    font.h2,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Цвет фона
                </Text>

                <Text
                  style={[
                    styles.hint,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  Выбери оттенок для светлой или тёмной темы
                </Text>

                {/* ===================================================
                    СВЕТЛАЯ ТЕМА
                    =================================================== */}

                <View style={styles.paletteSection}>
                  <Pressable
                    onPress={() => togglePalette("light")}
                    style={[
                      styles.themeCircleButton,
                      {
                        borderColor:
                          openPalette === "light"
                            ? colors.primary
                            : colors.border,
                      },
                      openPalette === "light" && styles.themeCircleActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Открыть светлую палитру"
                  >
                    <View
                      style={[
                        styles.themeCircle,
                        {
                          backgroundColor: "#FFFFFF",
                          borderColor: colors.border,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.circleArrow,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {openPalette === "light" ? "‹" : "›"}
                    </Text>
                  </Pressable>

                  {openPalette === "light" && (
                    <View style={styles.paletteOptions}>
                      {(Object.keys(BACKGROUNDS) as BackgroundId[]).map(
                        (id) => {
                          const item = BACKGROUNDS[id];

                          const active = selectedLight === id;

                          return (
                            <Pressable
                              key={id}
                              onPress={() => {
                                setBackground(id);
                                setOpenPalette(null);
                              }}
                              style={[
                                styles.colorOption,
                                active && {
                                  borderColor: colors.primary,
                                  backgroundColor: colors.primarySoft,
                                },
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel={`Светлый фон: ${item.label}`}
                            >
                              <View
                                style={[
                                  styles.colorPreview,
                                  {
                                    backgroundColor: item.background,
                                    borderColor: item.border,
                                  },
                                  active && {
                                    borderWidth: 3,
                                    borderColor: colors.primary,
                                  },
                                ]}
                              />

                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.colorLabel,
                                  {
                                    color: active
                                      ? colors.text
                                      : colors.textMuted,
                                    fontWeight: active ? "700" : "400",
                                  },
                                ]}
                              >
                                {item.label}
                              </Text>
                            </Pressable>
                          );
                        },
                      )}
                    </View>
                  )}
                </View>

                {/* ===================================================
                    ТЁМНАЯ ТЕМА
                    =================================================== */}

                <View style={styles.paletteSection}>
                  <Pressable
                    onPress={() => togglePalette("dark")}
                    style={[
                      styles.themeCircleButton,
                      {
                        borderColor:
                          openPalette === "dark"
                            ? colors.primary
                            : colors.border,
                      },
                      openPalette === "dark" && styles.themeCircleActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Открыть тёмную палитру"
                  >
                    <View
                      style={[
                        styles.themeCircle,
                        {
                          backgroundColor: "#252525",
                          borderColor: colors.border,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.circleArrow,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {openPalette === "dark" ? "‹" : "›"}
                    </Text>
                  </Pressable>

                  {openPalette === "dark" && (
                    <View style={styles.paletteOptions}>
                      {(
                        Object.keys(DARK_BACKGROUNDS) as DarkBackgroundId[]
                      ).map((id) => {
                        const item = DARK_BACKGROUNDS[id];

                        const active = selectedDark === id;

                        return (
                          <Pressable
                            key={id}
                            onPress={() => {
                              setDarkBackground(id);
                              setOpenPalette(null);
                            }}
                            style={[
                              styles.colorOption,
                              active && {
                                borderColor: colors.primary,
                                backgroundColor: colors.primarySoft,
                              },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Тёмный фон: ${item.label}`}
                          >
                            <View
                              style={[
                                styles.colorPreview,
                                {
                                  backgroundColor: item.background,
                                  borderColor: item.border,
                                },
                                active && {
                                  borderWidth: 3,
                                  borderColor: colors.primary,
                                },
                              ]}
                            />

                            <Text
                              numberOfLines={1}
                              style={[
                                styles.colorLabel,
                                {
                                  color: active
                                    ? colors.text
                                    : colors.textMuted,
                                  fontWeight: active ? "700" : "400",
                                },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.hint,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  Светлая и тёмная темы запоминают свои оттенки отдельно.
                </Text>
              </View>

              {/* =====================================================
                  УВЕДОМЛЕНИЯ
                  ===================================================== */}

              <View style={styles.rowBetween}>
                <View style={styles.notificationText}>
                  <Text
                    style={[
                      font.h2,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Напоминания
                  </Text>

                  <Text
                    style={[
                      styles.hint,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Получать напоминания о делах
                  </Text>
                </View>

                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{
                    true: colors.primary,
                    false: colors.border,
                  }}
                />
              </View>

              {/* =====================================================
                  СБРОС
                  ===================================================== */}

              <Button
                title="Сбросить все данные"
                onPress={confirmReset}
                variant="danger"
              />

              <Text
                style={[
                  styles.version,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                RemindMe 0.1
              </Text>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  edgeGesture: {
    position: "absolute",
    left: 0,
    top: 100,
    bottom: 130,
    zIndex: 2000,
  },

  backdrop: {
    backgroundColor: "#000",
  },

  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,

    borderRightWidth: StyleSheet.hairlineWidth,

    elevation: 20,

    shadowOffset: {
      width: 4,
      height: 0,
    },

    shadowOpacity: 0.18,
    shadowRadius: 12,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 22,
  },

  header: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },

  section: {
    gap: 10,
  },

  avatarContainer: {
    alignItems: "center",
    paddingVertical: 4,
  },

  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  /* =========================================================
     ПАЛИТРЫ
     ========================================================= */

  paletteSection: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    gap: 10,
  },

  themeCircleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingLeft: 3,
    paddingRight: 2,
    flexShrink: 0,
  },

  themeCircleActive: {
    borderWidth: 2,
  },

  themeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },

  circleArrow: {
    width: 12,
    fontSize: 22,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "300",
  },

  paletteOptions: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },

  colorOption: {
    flex: 1,
    minWidth: 0,
    maxWidth: 48,

    minHeight: 62,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 13,
    borderWidth: 1,
    borderColor: "transparent",

    paddingVertical: 4,
    paddingHorizontal: 2,

    gap: 3,
  },

  colorPreview: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
  },

  colorLabel: {
    width: "100%",
    fontSize: 8,
    lineHeight: 10,
    textAlign: "center",
  },

  hint: {
    fontSize: 12,
    lineHeight: 17,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  notificationText: {
    flex: 1,
    gap: 2,
  },

  version: {
    textAlign: "center",
    fontSize: 12,
  },
});
