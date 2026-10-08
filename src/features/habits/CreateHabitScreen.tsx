import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/shared/components/Button";
import { Chip } from "@/shared/components/Chip";
import { FormScreen } from "@/shared/components/FormScreen";
import { Stepper } from "@/shared/components/Stepper";
import { TextField } from "@/shared/components/TextField";

import { HabitKind, useAppStore } from "@/store/useAppStore";

import { useTheme } from "@/theme/useTheme";

const UNITS = ["раз", "стаканов", "минут", "страниц", "чашки"];

export default function CreateHabitScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { id, kind: kindParam } = useLocalSearchParams<{
    id?: string;
    kind?: string;
  }>();

  const habits = useAppStore((state) => state.habits);

  const addHabit = useAppStore((state) => state.addHabit);

  const updateHabit = useAppStore((state) => state.updateHabit);

  const removeHabit = useAppStore((state) => state.removeHabit);

  const existing = habits.find((habit) => habit.id === id);

  const [title, setTitle] = useState(existing?.title ?? "");

  const [kind, setKind] = useState<HabitKind>(
    existing?.kind ?? (kindParam === "bad" ? "bad" : "good"),
  );

  const [goal, setGoal] = useState(existing?.goal ?? 1);

  const [unit, setUnit] = useState(existing?.unit ?? "раз");

  const save = () => {
    const name = title.trim();

    if (!name) {
      return;
    }

    const data = {
      title: name,
      kind,
      goal: Math.max(1, goal),
      unit,
    };

    if (existing) {
      updateHabit(existing.id, data);
    } else {
      addHabit(data);
    }

    router.back();
  };

  const confirmDelete = () => {
    if (!existing) {
      return;
    }

    Alert.alert("Удалить привычку?", "Вместе с ней удалится вся история.", [
      {
        text: "Отмена",
        style: "cancel",
      },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          removeHabit(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <FormScreen
      title={existing ? "Привычка" : "Новая привычка"}
      footer={
        <>
          <Button title="Сохранить" onPress={save} disabled={!title.trim()} />

          {existing && (
            <Button title="Удалить" onPress={confirmDelete} variant="danger" />
          )}
        </>
      }
    >
      <TextField
        label="Название"
        value={title}
        onChangeText={setTitle}
        placeholder="Например, вода"
        autoFocus={!existing}
      />

      <View
        style={{
          gap: 8,
        }}
      >
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 13,
          }}
        >
          Тип
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Chip
            label="Полезная"
            active={kind === "good"}
            onPress={() => setKind("good")}
          />

          <Chip
            label="Вредная"
            active={kind === "bad"}
            onPress={() => setKind("bad")}
          />
        </View>
      </View>

      <View
        style={{
          gap: 8,
        }}
      >
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 13,
          }}
        >
          {kind === "good" ? "Цель на день" : "Лимит на день"}
        </Text>

        <Stepper value={goal} onChange={setGoal} />
      </View>

      <View
        style={{
          gap: 8,
        }}
      >
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 13,
          }}
        >
          Единица
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {UNITS.map((item) => (
            <Chip
              key={item}
              label={item}
              active={unit === item}
              onPress={() => setUnit(item)}
            />
          ))}
        </View>
      </View>
    </FormScreen>
  );
}
