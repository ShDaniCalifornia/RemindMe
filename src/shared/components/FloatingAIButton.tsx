import { useTheme } from "@/theme/useTheme";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CharacterAvatar } from "./CharacterAvatar";

export const TAB_BAR_HEIGHT = 56;

// Плавающая кнопка: открывает чат с персонажем из любой вкладки
export function FloatingAIButton() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => router.push("/ai-chat")}
      style={[
        styles.btn,
        {
          backgroundColor: colors.accent,
          bottom: TAB_BAR_HEIGHT + insets.bottom + 16,
        },
      ]}
    >
      <CharacterAvatar state="loving" size={34} circle={false} />
      <Text style={styles.text}>Поговорить</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 999,
    elevation: 4,
  },
  text: { color: "#fff", fontWeight: "600" },
});
