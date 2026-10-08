import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/shared/components/Card";
import { Chip } from "@/shared/components/Chip";
import { useAppStore } from "@/store/useAppStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

import HabitAnalytics from "./HabitAnalytics";

import { dateKey } from "@/shared/utils/date";

export default function HabitsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const habits = useAppStore((state) => state.habits);
  const bumpHabit = useAppStore((state) => state.bumpHabit);

  const [kind, setKind] = useState<"good" | "bad">("good");

  const todayKey = dateKey();

  const visibleHabits = useMemo(() => {
    return habits.filter((habit) => habit.kind === kind);
  }, [habits, kind]);

  const openCreateHabit = () => {
    router.push({
      pathname: "/create-habit",
      params: {
        kind,
      },
    });
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        style={[
          styles.scroll,
          {
            backgroundColor: colors.background,
          },
        ]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text
              style={[
                font.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Привычки
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Маленькие шаги каждый день
            </Text>
          </View>

          <Pressable
            onPress={openCreateHabit}
            accessibilityRole="button"
            accessibilityLabel="Добавить привычку"
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* GOOD / BAD */}
        <View style={styles.switchRow}>
          <Chip
            label="Полезные"
            active={kind === "good"}
            onPress={() => setKind("good")}
          />

          <Chip
            label="Вредные"
            active={kind === "bad"}
            onPress={() => setKind("bad")}
          />
        </View>

        {/* LIST */}
        <View style={styles.list}>
          {visibleHabits.length === 0 ? (
            <Card
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={kind === "good" ? "leaf-outline" : "close-circle-outline"}
                size={28}
                color={colors.textMuted}
              />

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {kind === "good"
                  ? "Полезных привычек пока нет"
                  : "Вредных привычек пока нет"}
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Добавьте привычку, чтобы она появилась здесь.
              </Text>

              <Pressable
                onPress={openCreateHabit}
                style={[
                  styles.emptyButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text style={styles.emptyButtonText}>Добавить</Text>
              </Pressable>
            </Card>
          ) : (
            visibleHabits.map((habit) => {
              const count = habit.log?.[todayKey] ?? 0;
              const goal = habit.goal ?? 1;
              const completed =
                habit.kind === "good" ? count >= goal : count > 0;

              return (
                <Card
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.habitInfo}>
                    <View style={styles.titleRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: completed
                              ? habit.kind === "bad"
                                ? "#D94F4F"
                                : colors.primary
                              : colors.border,
                          },
                        ]}
                      />

                      <Text
                        numberOfLines={2}
                        style={[
                          styles.habitTitle,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        {habit.title}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.habitProgress,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {count} / {goal} {habit.unit ?? ""}
                    </Text>
                  </View>

                  <View style={styles.counter}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Уменьшить ${habit.title}`}
                      onPress={() => bumpHabit(habit.id, -1)}
                      style={({ pressed }) => [
                        styles.counterButton,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: pressed ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="remove" size={18} color={colors.text} />
                    </Pressable>

                    <Text
                      style={[
                        styles.count,
                        {
                          color:
                            completed && habit.kind === "good"
                              ? colors.primary
                              : habit.kind === "bad" && count > 0
                                ? "#D94F4F"
                                : colors.text,
                        },
                      ]}
                    >
                      {count}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Увеличить ${habit.title}`}
                      onPress={() => bumpHabit(habit.id, 1)}
                      style={({ pressed }) => [
                        styles.counterButton,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: pressed ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="add" size={18} color={colors.text} />
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* ANALYTICS */}
        <View style={styles.analytics}>
          <HabitAnalytics />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  switchRow: {
    flexDirection: "row",
    gap: 8,
  },

  list: {
    gap: 10,
  },

  habitCard: {
    minHeight: 78,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  habitInfo: {
    flex: 1,
    gap: 6,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  habitTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  habitProgress: {
    fontSize: 12,
  },

  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  counterButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  count: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },

  emptyCard: {
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 8,
  },

  emptyTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  analytics: {
    marginTop: 4,
  },
});
