import { useTheme } from "@/theme/useTheme";
import { Pressable, Text } from "react-native";

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 82,
        paddingVertical: 8,
        borderRadius: 999,
        alignItems: "center",
        backgroundColor: active ? colors.primary : colors.primarySoft,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
