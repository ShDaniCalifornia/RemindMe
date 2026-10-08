import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useUiStore } from "@/store/useUiStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type Props = {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  settings?: boolean;
};

export function ScreenHeader({ title, subtitle, onAdd, settings }: Props) {
  const { colors } = useTheme();

  const setDrawer = useUiStore((s) => s.setDrawer);

  const round = [
    styles.round,
    {
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
  ];

  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        <Text style={[font.title, { color: colors.text }]}>{title}</Text>

        {subtitle ? (
          <Text style={{ color: colors.textMuted }}>{subtitle}</Text>
        ) : null}
      </View>

      {onAdd && (
        <Pressable onPress={onAdd} style={round} accessibilityLabel="Добавить">
          <Ionicons name="add" size={24} color={colors.primaryDeep} />
        </Pressable>
      )}

      {settings && (
        <Pressable
          onPress={() => setDrawer(true)}
          style={round}
          accessibilityLabel="Настройки"
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
  },

  titleWrap: {
    flex: 1,
  },

  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
