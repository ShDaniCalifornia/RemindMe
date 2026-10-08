import {
  FloatingAIButton,
  TAB_BAR_HEIGHT,
} from "@/shared/components/FloatingAIButton";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ColorValue, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const tab = (title: string, icon: IconName, iconActive: IconName) => ({
  title,
  tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? iconActive : icon} size={24} color={color} />
  ),
});

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryDeep,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={tab("Сегодня", "home-outline", "home")}
        />
        <Tabs.Screen
          name="habits"
          options={tab("Привычки", "leaf-outline", "leaf")}
        />
        <Tabs.Screen
          name="notes"
          options={tab("Архив", "layers-outline", "layers")}
        />
        <Tabs.Screen
          name="plans"
          options={tab("Планы", "calendar-outline", "calendar")}
        />
      </Tabs>
      <FloatingAIButton />
    </View>
  );
}
