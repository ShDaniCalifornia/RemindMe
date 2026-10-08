import { useColorScheme } from "@/shared/hooks/useColorScheme";
import { useAppStore } from "@/store/useAppStore";
import Colors, {
  BackgroundId,
  BACKGROUNDS,
  DARK_BACKGROUNDS,
  DarkBackgroundId,
} from "./colors";

export function useTheme() {
  const system = useColorScheme() ?? "light";

  const themePref = useAppStore((s) => s.themePref);
  const backgroundPref = useAppStore((s) => s.backgroundPref);
  const darkBackgroundPref = useAppStore((s) => s.darkBackgroundPref);

  const scheme = themePref === "system" ? system : themePref;

  const colors =
    scheme === "light"
      ? {
          ...Colors.light,
          ...BACKGROUNDS[backgroundPref as BackgroundId],
        }
      : {
          ...Colors.dark,
          ...DARK_BACKGROUNDS[darkBackgroundPref as DarkBackgroundId],
        };

  return {
    colors,
    isDark: scheme === "dark",
    scheme,
  };
}
