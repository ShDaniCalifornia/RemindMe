import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TaskRow } from "@/features/plans/TaskRow";
import {
  countToday,
  Mood,
  useAppStore,
  useTodayMood,
} from "@/store/useAppStore";

import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

import { addDays, dateKey } from "@/shared/utils/date";
import { compareTasks } from "@/shared/utils/tasks";

import { Card } from "@/shared/components/Card";
import {
  CharacterAvatar,
  CharacterState,
} from "@/shared/components/CharacterAvatar";
import { MoodPicker } from "@/shared/components/MoodPicker";
import { MoodSheet } from "@/shared/components/MoodSheet";
import { ProgressRing } from "@/shared/components/ProgressRing";
import { Screen } from "@/shared/components/Screen";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

// Настроения идут слева направо:
// от самого тяжёлого состояния к самому хорошему.
//
// low      -> worried
// anxious  -> shy
// tired    -> sleep
// calm     -> calm
// happy    -> happy
//
// То есть и порядок, и поза соответствуют смыслу эмоции.
const MOOD_POSE: Record<Mood, CharacterState> = {
  low: "worried",
  anxious: "shy",
  tired: "sleep",
  calm: "calm",
  happy: "happy",
};

const MAX_VISIBLE_TASKS = 3;

function PlanSection({
  title,
  tasks,
  onAll,
}: {
  title: string;
  tasks: ReturnType<typeof useAppStore.getState>["tasks"];
  onAll: () => void;
}) {
  const { colors } = useTheme();

  const visible = tasks.slice(0, MAX_VISIBLE_TASKS);

  return (
    <View style={styles.planSection}>
      <View style={styles.sectionHeader}>
        <Text
          style={[
            font.h2,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Pressable onPress={onAll} hitSlop={8}>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            Все планы
          </Text>
        </Pressable>
      </View>

      {visible.length > 0 ? (
        visible.map((task) => <TaskRow key={task.id} task={task} />)
      ) : (
        <Card style={styles.emptyPlan}>
          <Text
            style={{
              color: colors.textMuted,
            }}
          >
            {title === "Планы на сегодня"
              ? "На сегодня ничего не запланировано."
              : "На завтра ничего не запланировано."}
          </Text>
        </Card>
      )}

      {tasks.length > MAX_VISIBLE_TASKS && (
        <Pressable onPress={onAll} style={styles.morePlans}>
          <Text
            style={{
              color: colors.primaryDeep,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            Ещё {tasks.length - MAX_VISIBLE_TASKS}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const habits = useAppStore((s) => s.habits);
  const tasks = useAppStore((s) => s.tasks);
  const name = useAppStore((s) => s.name);

  const addMoodEntry = useAppStore((s) => s.addMoodEntry);
  const updateMoodEntry = useAppStore((s) => s.updateMoodEntry);

  const mood = useTodayMood();

  const [pending, setPending] = useState<{
    id: string;
    mood: Mood;
  } | null>(null);

  // =========================
  // ПРИВЫЧКИ
  // =========================

  const good = habits.filter((habit) => habit.kind === "good");

  const doneHabits = good.filter(
    (habit) => countToday(habit) >= habit.goal,
  ).length;

  const pct = good.length ? doneHabits / good.length : 0;

  // =========================
  // ПЛАНЫ
  // =========================

  const today = dateKey();

  const tomorrow = dateKey(addDays(new Date(), 1));

  const todayTasks = tasks
    .filter((task) => task.date === today)
    .sort(compareTasks);

  const tomorrowTasks = tasks
    .filter((task) => task.date === tomorrow)
    .sort(compareTasks);

  // =========================
  // НАСТРОЕНИЕ
  // =========================

  const onPickMood = (selectedMood: Mood) => {
    const id = addMoodEntry({
      mood: selectedMood,
    });

    setPending({
      id,
      mood: selectedMood,
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Сегодня"
        subtitle={name ? `Привет, ${name}` : "Как вы сегодня?"}
        settings
      />

      {/* =========================
          ПЕРСОНАЖ
         ========================= */}

      <View style={styles.hero}>
        <Pressable
          onPress={() => router.push("/anti-stress")}
          accessibilityLabel="Открыть антистресс"
        >
          <CharacterAvatar state={mood ? MOOD_POSE[mood] : "calm"} size={170} />
        </Pressable>

        <Text
          style={{
            color: colors.textMuted,
            fontSize: 12,
            marginTop: 6,
          }}
        >
          Нажмите на меня, если нужна передышка
        </Text>

        {__DEV__ && (
          <Link
            href="/character-preview"
            style={{
              color: colors.textMuted,
              marginTop: 4,
              fontSize: 12,
            }}
          >
            dev: все состояния персонажа
          </Link>
        )}
      </View>

      {/* =========================
          НАСТРОЕНИЕ
         ========================= */}

      <Card>
        <Text
          style={[
            font.h2,
            {
              color: colors.text,
              marginBottom: 12,
            },
          ]}
        >
          Какое у вас настроение?
        </Text>

        <MoodPicker onPick={onPickMood} />
      </Card>

      {/* =========================
          ПРИВЫЧКИ
         ========================= */}

      <Card>
        <View style={styles.ringItem}>
          <ProgressRing progress={pct} size={64} label={`${doneHabits}`} />

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={[
                font.h2,
                {
                  color: colors.text,
                },
              ]}
            >
              Привычки
            </Text>

            <Text
              style={{
                color: colors.textMuted,
              }}
            >
              {doneHabits} из {good.length} выполнено
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/habits")}
            hitSlop={10}
            accessibilityLabel="Открыть привычки"
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </Card>

      {/* =========================
          ПЛАНЫ НА СЕГОДНЯ
         ========================= */}

      <PlanSection
        title="Планы на сегодня"
        tasks={todayTasks}
        onAll={() => router.push("/plans")}
      />

      {/* =========================
          ПЛАНЫ НА ЗАВТРА
         ========================= */}

      <PlanSection
        title="Планы на завтра"
        tasks={tomorrowTasks}
        onAll={() => router.push("/plans")}
      />

      {/* =========================
          БЫСТРАЯ ЗАПИСЬ НАСТРОЕНИЯ
         ========================= */}

      {pending && (
        <MoodSheet
          mood={pending.mood}
          onClose={() => setPending(null)}
          onSave={(note, tags) => {
            updateMoodEntry(pending.id, {
              note: note || undefined,
              tags: tags.length ? tags : undefined,
            });

            setPending(null);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
  },

  talkButton: {
    flexDirection: "row",
    alignItems: "center",

    minHeight: 64,

    paddingHorizontal: 10,
    paddingVertical: 8,

    borderRadius: 20,

    gap: 8,
  },

  talkText: {
    flex: 1,
  },

  talkTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  talkSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: 2,
  },

  ringItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  planSection: {
    gap: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 2,
  },

  emptyPlan: {
    paddingVertical: 14,
  },

  morePlans: {
    alignItems: "center",
    paddingVertical: 4,
  },
});
