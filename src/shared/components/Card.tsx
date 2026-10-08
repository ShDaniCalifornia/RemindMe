import { radius } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

// Изменили тип style на StyleProp<ViewStyle>
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
});
