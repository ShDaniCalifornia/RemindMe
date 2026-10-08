import { Card } from "@/shared/components/Card";
import { Chip } from "@/shared/components/Chip";
import { withAlpha } from "@/shared/utils/color";
import { dateKey, formatDay } from "@/shared/utils/date";
import {
  dayCompletion,
  daysWord,
  habitStreak,
  heatLevel,
} from "@/shared/utils/stats";
import { MOOD_LABELS, Mood, useAppStore } from "@/store/useAppStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Heatmap from "./Heatmap";

// от тяжёлого настроения к лёгкому; рядом всегда подписи, цвет не единственный признак
const MOOD_ORDER: Mood[] = ["low", "anxious", "tired", "calm", "happy"];
const MOOD_COLORS = ["#E39A8D", "#E8B48F", "#D9CFA5", "#A9C3A4", "#6B8A6E"];

export function HabitAnalytics() {
  const { colors } = useTheme();
  const habits = useAppStore((s) => s.habits);
  const moodLog = useAppStore((s) => s.moodLog);
  const entries = useAppStore((s) => s.moodEntries);
  const [metric, setMetric] = useState<"habits" | "mood">("habits");
  const [sel, setSel] = useState<string | null>(null);

  const empty = withAlpha(colors.textMuted, 0.15);
  const habitPalette = [
    empty,
    withAlpha(colors.primary, 0.3),
    withAlpha(colors.primary, 0.5),
    withAlpha(colors.primary, 0.75),
    colors.primary,
  ];
  const moodPalette = [empty, ...MOOD_COLORS];

  const habitLevel = (key: string) => {
    const c = dayCompletion(habits, key);
    return c ? heatLevel(c.done, c.total) : 0;
  };
  const moodLevel = (key: string) => {
    const m = moodLog[key];
    return m ? MOOD_ORDER.indexOf(m) + 1 : 0;
  };

  let detail = "Нажмите на день, чтобы посмотреть подробности.";
  if (sel) {
    if (metric === "habits") {
      const c = dayCompletion(habits, sel);
      detail = c
        ? `${formatDay(sel)}: выполнено ${c.done} из ${c.total} полезных привычек.`
        : `${formatDay(sel)}: привычек нет.`;
    } else {
      detail = `${formatDay(sel)}: ${moodLog[sel] ? MOOD_LABELS[moodLog[sel]] : "настроение не отмечено"}.`;
    }
  }

  // лента настроения: за выбранный день или последние отметки
  const shown =
    metric === "mood"
      ? sel
        ? entries.filter((e) => dateKey(new Date(e.at)) === sel)
        : entries.slice(-8).reverse()
      : [];

  const streaks = habits
    .map((h) => ({ h, days: habitStreak(h) }))
    .filter((x) => x.days > 0)
    .sort((a, b) => b.days - a.days);

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.row}>
        <Chip
          label="Привычки"
          active={metric === "habits"}
          onPress={() => setMetric("habits")}
        />
        <Chip
          label="Настроение"
          active={metric === "mood"}
          onPress={() => setMetric("mood")}
        />
      </View>

      <Card style={{ gap: 12 }}>
        <Heatmap
          level={metric === "habits" ? habitLevel : moodLevel}
          palette={metric === "habits" ? habitPalette : moodPalette}
          selected={sel}
          onSelect={setSel}
        />
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{detail}</Text>
        {metric === "habits" ? (
          <View style={styles.row}>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
              меньше
            </Text>
            {habitPalette.map((c, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: c }]} />
            ))}
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
              больше
            </Text>
          </View>
        ) : (
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {MOOD_ORDER.map((m, i) => (
              <View key={m} style={styles.row}>
                <View
                  style={[styles.dot, { backgroundColor: MOOD_COLORS[i] }]}
                />
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  {MOOD_LABELS[m]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {metric === "mood" && (
        <View style={{ gap: 8 }}>
          <Text style={[font.h2, { color: colors.text }]}>
            {sel ? "Записи за день" : "Последние отметки"}
          </Text>
          {shown.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>
              Пока ничего нет. Выберите настроение на экране «Сегодня».
            </Text>
          ) : (
            shown.map((e) => {
              const d = new Date(e.at);
              return (
                <Card key={e.id} style={{ gap: 4, paddingVertical: 12 }}>
                  <View
                    style={[styles.row, { justifyContent: "space-between" }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {MOOD_LABELS[e.mood]}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {formatDay(dateKey(d))},{" "}
                      {String(d.getHours()).padStart(2, "0")}:
                      {String(d.getMinutes()).padStart(2, "0")}
                    </Text>
                  </View>
                  {e.tags?.length ? (
                    <Text style={{ color: colors.primaryDeep, fontSize: 12 }}>
                      {e.tags.join(" · ")}
                    </Text>
                  ) : null}
                  {e.note ? (
                    <Text style={{ color: colors.text }}>{e.note}</Text>
                  ) : null}
                </Card>
              );
            })
          )}
        </View>
      )}

      <Text style={[font.h2, { color: colors.text }]}>Серии</Text>
      {streaks.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>
          Серии появятся, когда вы отметите привычку несколько дней подряд.
        </Text>
      ) : (
        streaks.map(({ h, days }) => (
          <Card
            key={h.id}
            style={[
              styles.row,
              { justifyContent: "space-between", paddingVertical: 12 },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {h.title}
            </Text>
            <View style={styles.row}>
              <Ionicons name="flame" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent }}>
                {daysWord(days)} подряд
              </Text>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 3 },
});
