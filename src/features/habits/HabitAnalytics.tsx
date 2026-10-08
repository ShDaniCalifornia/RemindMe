import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { Card } from "@/shared/components/Card";
import { Chip } from "@/shared/components/Chip";
import { addDays, dateKey } from "@/shared/utils/date";
import { MOOD_LABELS, Mood, useAppStore } from "@/store/useAppStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

import Heatmap, { HeatmapValue } from "./Heatmap";

type Mode = "habits" | "mood";

const MOOD_ORDER: Mood[] = ["low", "anxious", "tired", "calm", "happy"];

const EMPTY_COLOR = "#E8E8E8";

function formatDay(key: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${key}T00:00:00`));
}

function daysWord(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "день";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return "дня";
  }

  return "дней";
}

function getGoodLevel(goodCount: number, completedCount: number) {
  if (goodCount <= 0) {
    return 0;
  }

  if (completedCount <= 0) {
    return 0;
  }

  return Math.min(4, Math.ceil((completedCount / goodCount) * 4));
}

function getBadLevel(badCount: number) {
  if (badCount <= 0) {
    return 0;
  }

  /*
   * 1 выполнение = лёгкий красный
   * 2 = заметный
   * 3 = сильный
   * 4+ = максимальный
   */
  return Math.min(4, badCount);
}

function calculateStreak(
  habits: ReturnType<typeof useAppStore.getState>["habits"],
) {
  const goodHabits = habits.filter((habit) => habit.kind === "good");

  if (!goodHabits.length) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();

  while (true) {
    const key = dateKey(cursor);

    const completed = goodHabits.every(
      (habit) => (habit.log?.[key] ?? 0) >= Math.max(1, habit.goal),
    );

    if (!completed) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export default function HabitAnalytics() {
  const { colors } = useTheme();

  const habits = useAppStore((state) => state.habits);

  const moodLog = useAppStore((state) => state.moodLog);

  const moodEntries = useAppStore((state) => state.moodEntries);

  const [mode, setMode] = useState<Mode>("habits");

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const goodHabits = useMemo(
    () => habits.filter((habit) => habit.kind === "good"),
    [habits],
  );

  const badHabits = useMemo(
    () => habits.filter((habit) => habit.kind === "bad"),
    [habits],
  );

  const streak = useMemo(() => calculateStreak(habits), [habits]);

  const habitLevel = (key: string): HeatmapValue => {
    const completedGood = goodHabits.filter(
      (habit) => (habit.log?.[key] ?? 0) >= Math.max(1, habit.goal),
    ).length;

    const goodLevel = getGoodLevel(goodHabits.length, completedGood);

    const badExecutions = badHabits.reduce(
      (sum, habit) => sum + (habit.log?.[key] ?? 0),
      0,
    );

    const redLevel = getBadLevel(badExecutions);

    /*
     * Если вредная привычка была,
     * обязательно оставляем зелёную половину.
     * Даже если полезных привычек в этот день
     * не было выполнено.
     */
    const visibleGreenLevel = redLevel > 0 ? Math.max(1, goodLevel) : goodLevel;

    return {
      green: visibleGreenLevel,
      red: redLevel,
    };
  };

  const moodLevel = (key: string) => {
    const mood = moodLog[key];

    if (!mood) {
      return 0;
    }

    const index = MOOD_ORDER.indexOf(mood);

    return index >= 0 ? index + 1 : 0;
  };

  const selectedHabitInfo = selectedDay ? habitLevel(selectedDay) : null;

  const selectedMood = selectedDay ? moodLog[selectedDay] : null;

  const latestMood =
    moodEntries.length > 0 ? moodEntries[moodEntries.length - 1] : null;

  const habitPalette = [
    EMPTY_COLOR,
    "#DCE9DD",
    "#BFD4C1",
    "#9DBAA0",
    colors.primary,
  ];

  const redPalette = [EMPTY_COLOR, "#F5D8D6", "#EBA9A5", "#DF7772", "#C94B47"];

  const moodPalette = [
    EMPTY_COLOR,
    "#E39A8D",
    "#E8B48F",
    "#D9CFA5",
    "#A9C3A4",
    "#6B8A6E",
  ];

  return (
    <Card
      style={{
        padding: 16,
        gap: 16,
      }}
    >
      <View
        style={{
          gap: 4,
        }}
      >
        <Text
          style={{
            color: colors.text,
            ...font.h2,
            fontWeight: "700",
          }}
        >
          Аналитика
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            ...font.body,
          }}
        >
          История привычек и настроения
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Chip
          label="Привычки"
          active={mode === "habits"}
          onPress={() => {
            setMode("habits");
            setSelectedDay(null);
          }}
        />

        <Chip
          label="Настроение"
          active={mode === "mood"}
          onPress={() => {
            setMode("mood");
            setSelectedDay(null);
          }}
        />
      </View>

      {mode === "habits" ? (
        <>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 12,
                backgroundColor: colors.background,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  ...font.caption,
                }}
              >
                Полезных
              </Text>

              <Text
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {goodHabits.length}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 12,
                backgroundColor: colors.background,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  ...font.caption,
                }}
              >
                Вредных
              </Text>

              <Text
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {badHabits.length}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 12,
                backgroundColor: colors.background,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  ...font.caption,
                }}
              >
                Серия
              </Text>

              <Text
                style={{
                  color: colors.primary,
                  fontSize: 22,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {streak}
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                }}
              >
                {daysWord(streak)}
              </Text>
            </View>
          </View>

          <View
            style={{
              gap: 8,
            }}
          >
            <Text
              style={{
                color: colors.text,
                ...font.body,
                fontWeight: "700",
              }}
            >
              Последние 16 недель
            </Text>

            <Heatmap
              weeks={16}
              level={habitLevel}
              palette={habitPalette}
              redPalette={redPalette}
              selected={selectedDay}
              onSelect={setSelectedDay}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.primary,
              }}
            />

            <Text
              style={{
                color: colors.textMuted,
                ...font.caption,
              }}
            >
              полезные
            </Text>

            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: redPalette[3],
              }}
            />

            <Text
              style={{
                color: colors.textMuted,
                ...font.caption,
              }}
            >
              вредные
            </Text>
          </View>

          {selectedDay && (
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 14,
                padding: 12,
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  ...font.body,
                  fontWeight: "700",
                }}
              >
                {formatDay(selectedDay)}
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  ...font.caption,
                }}
              >
                Полезных выполнено:{" "}
                {
                  goodHabits.filter(
                    (habit) =>
                      (habit.log?.[selectedDay] ?? 0) >=
                      Math.max(1, habit.goal),
                  ).length
                }{" "}
                из {goodHabits.length}
              </Text>

              <Text
                style={{
                  color:
                    selectedHabitInfo &&
                    typeof selectedHabitInfo !== "number" &&
                    selectedHabitInfo.red > 0
                      ? "#C94B47"
                      : colors.textMuted,
                  ...font.caption,
                }}
              >
                Вредных выполнений:{" "}
                {badHabits.reduce(
                  (sum, habit) => sum + (habit.log?.[selectedDay] ?? 0),
                  0,
                )}
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 14,
              padding: 12,
              gap: 4,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                ...font.caption,
              }}
            >
              Последняя отметка
            </Text>

            <Text
              style={{
                color: colors.text,
                ...font.body,
                fontWeight: "700",
              }}
            >
              {latestMood ? MOOD_LABELS[latestMood.mood] : "Пока нет отметок"}
            </Text>
          </View>

          <View
            style={{
              gap: 8,
            }}
          >
            <Text
              style={{
                color: colors.text,
                ...font.body,
                fontWeight: "700",
              }}
            >
              Настроение
            </Text>

            <Heatmap
              weeks={16}
              level={moodLevel}
              palette={moodPalette}
              selected={selectedDay}
              onSelect={setSelectedDay}
            />
          </View>

          {selectedDay && (
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 14,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  ...font.body,
                  fontWeight: "700",
                }}
              >
                {formatDay(selectedDay)}
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  ...font.caption,
                  marginTop: 4,
                }}
              >
                {selectedMood
                  ? MOOD_LABELS[selectedMood]
                  : "Настроение не отмечено"}
              </Text>
            </View>
          )}

          <View
            style={{
              gap: 6,
            }}
          >
            {MOOD_ORDER.map((mood, index) => (
              <View
                key={mood}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: moodPalette[index + 1],
                  }}
                />

                <Text
                  style={{
                    color: colors.textMuted,
                    ...font.caption,
                  }}
                >
                  {MOOD_LABELS[mood]}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}
