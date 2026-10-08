import { SettingsDrawer } from "@/shared/components/SettingsDrawer";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export const unstable_settings = { initialRouteName: "(tabs)" };

export default function RootLayout() {
  // ждём, пока из памяти телефона загрузятся сохранённые данные и тема (без «мигания» темы)
  const [ready, setReady] = useState(useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setReady(true));
    setReady(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);
  if (!ready) return null;
  return <RootNav />;
}

function RootNav() {
  const { colors, isDark } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="ai-chat" options={{ presentation: "modal" }} />
            <Stack.Screen
              name="create-habit"
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="create-task"
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="create-note"
              options={{ presentation: "modal" }}
            />
            <Stack.Screen name="character-preview" />
            <Stack.Screen
              name="album-create"
              options={{ presentation: "modal" }}
            />
            <Stack.Screen name="album/[id]" />
          </Stack>
          {/* боковая панель поверх всего: свайп справа налево или шестерёнка на «Сегодня» */}
          <SettingsDrawer />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
