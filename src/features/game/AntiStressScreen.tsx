import {
  CharacterAvatar,
  CharacterState,
} from "@/shared/components/CharacterAvatar";
import { Chip } from "@/shared/components/Chip";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SIZE = 250;
const MARGIN = 6; // зазор до края «сцены»

// Знаки осей акселерометра. Если при встряхивании персонаж летит в обратную
// сторону (на iOS и Android оси могут отличаться), поменяйте знак здесь.
const SIGN_X = -1;
const SIGN_Y = 1;

type Mode = "pet" | "shake";
type HeartItem = { id: number; x: number };

const buzz = (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) => {
  if (Platform.OS === "web") return;
  try {
    Haptics.impactAsync(style).catch(() => {});
  } catch {
    // устройство без Haptics
  }
};

const clamp = (v: number, lo: number, hi: number) => {
  "worklet";
  return Math.min(hi, Math.max(lo, v));
};

function Heart({ x, onDone }: { x: number; onDone: () => void }) {
  const { colors } = useTheme();
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(1, { duration: 1400 }, (fin) => {
      if (fin) runOnJS(onDone)();
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ translateY: -130 * p.value }, { scale: 0.7 + 0.5 * p.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.heart, { left: x - 13 }, style]}
    >
      <Ionicons name="heart" size={26} color={colors.accent} />
    </Animated.View>
  );
}

export function AntiStressScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("pet");
  const [pose, setPose] = useState<CharacterState>("calm");
  const [hearts, setHearts] = useState<HeartItem[]>([]);
  const [warmth, setWarmth] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextId = useRef(0);

  const hold = useCallback((s: CharacterState) => {
    if (timer.current) clearTimeout(timer.current);
    setPose(s);
  }, []);

  const react = useCallback((s: CharacterState, ms = 1200) => {
    if (timer.current) clearTimeout(timer.current);
    setPose(s);
    timer.current = setTimeout(() => setPose("calm"), ms);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const addHeart = useCallback(
    (x: number) => {
      setHearts((h) => [
        ...h.slice(-6),
        {
          id: nextId.current++,
          x,
        },
      ]);

      setWarmth((w) => w + 1);

      react("loving", 1500);

      buzz(Haptics.ImpactFeedbackStyle.Light);
    },
    [react],
  );

  const onTap = useCallback(() => {
    react("happy", 900);
    buzz();
  }, [react]);

  // --- shared values (всё, что читает физика, живёт на UI-потоке) ---
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const vx = useSharedValue(0);
  const vy = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const rot = useSharedValue(0);
  const kick = useSharedValue(0); // дополнительный «поворот от удара»
  const dist = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);
  const touching = useSharedValue(false); // палец на персонаже (любой режим)
  const settling = useSharedValue(false); // пружина возвращает в центр

  // границы «сцены» считаем по её реальному размеру
  const maxX = useSharedValue(0);
  const minY = useSharedValue(0);
  const maxY = useSharedValue(0);

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const contentH = SIZE + 24 + 20; // персонаж + отступ + строка «Тепла»
    const top = (height - contentH) / 2;
    maxX.value = Math.max(0, (width - SIZE) / 2 - MARGIN);
    minY.value = -Math.max(0, top - MARGIN);
    maxY.value = Math.max(0, height - (top + SIZE) - MARGIN);
  };

  const grab = () => {
    "worklet";
    touching.value = true;
    settling.value = false;
    cancelAnimation(tx);
    cancelAnimation(ty);
    vx.value = 0;
    vy.value = 0;
  };

  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(() => {
      sx.value = withSequence(
        withTiming(1.1, { duration: 70 }),
        withSpring(1, { damping: 4 }),
      );
      sy.value = withSequence(
        withTiming(0.88, { duration: 70 }),
        withSpring(1, { damping: 4 }),
      );
      runOnJS(onTap)();
    });

    // «Трясти»: хватаем, тянем, бросаем
    const shakeGesture = Gesture.Pan()
      .minDistance(6)
      .onStart(() => {
        grab();
        startTx.value = tx.value;
        startTy.value = ty.value;
        runOnJS(hold)("cheer");
      })
      .onUpdate((e) => {
        tx.value = clamp(
          startTx.value + e.translationX,
          -maxX.value,
          maxX.value,
        );
        ty.value = clamp(
          startTy.value + e.translationY,
          minY.value,
          maxY.value,
        );
        rot.value = clamp(e.velocityX * 0.01, -20, 20);
      })
      .onEnd((e) => {
        vx.value = e.velocityX * 0.02;
        vy.value = e.velocityY * 0.02;
        runOnJS(react)("happy", 1200);
      })
      .onFinalize(() => {
        touching.value = false;
      });

    // «Гладить»: лёгкое смещение за пальцем + сердечки
    const petGesture = Gesture.Pan()
      .minDistance(6)
      .onStart(() => {
        grab();
        dist.value = 0;
        lastX.value = 0;
        lastY.value = 0;
        runOnJS(hold)("loving");
      })
      .onUpdate((e) => {
        tx.value = clamp(e.translationX * 0.12, -20, 20);
        ty.value = clamp(e.translationY * 0.12, -20, 20);

        dist.value +=
          Math.abs(e.translationX - lastX.value) +
          Math.abs(e.translationY - lastY.value);
        lastX.value = e.translationX;
        lastY.value = e.translationY;

        if (dist.value > 150) {
          dist.value = 0;
          runOnJS(addHeart)(e.x);
        }
      })
      .onEnd(() => {
        settling.value = true;
        tx.value = withSpring(0, { damping: 10 });
        ty.value = withSpring(0, { damping: 10 });
        runOnJS(react)("cheer", 1200);
      })
      .onFinalize(() => {
        touching.value = false;
      });

    return Gesture.Race(mode === "shake" ? shakeGesture : petGesture, tap);
  }, [mode, hold, react, onTap, addHeart]);

  // --- физика целиком на UI-потоке ---
  const squash = (axis: "x" | "y", dir: number) => {
    "worklet";

    const target = axis === "x" ? sx : sy;

    target.value = withSequence(
      withTiming(0.82, {
        duration: 50,
      }),
      withSpring(1),
    );

    kick.value = withSequence(
      withTiming(dir * 15, {
        duration: 50,
      }),
      withSpring(0),
    );

    runOnJS(react)("sleep", 420);

    runOnJS(buzz)(Haptics.ImpactFeedbackStyle.Light);
  };

  useFrameCallback((frame) => {
    "worklet";
    // пока держим или идёт возврат пружиной, физика не вмешивается
    if (touching.value || settling.value) return;

    // нормализуем к 60 fps, чтобы на 90/120 Гц было то же поведение
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16.7) / 16.7, 3);

    const friction = Math.pow(0.93, dt);
    vx.value *= friction;
    vy.value *= friction;

    let x = tx.value + vx.value * dt;
    let y = ty.value + vy.value * dt;

    if (x > maxX.value) {
      x = maxX.value;
      vx.value = -vx.value * 0.7;
      squash("x", -1);
    } else if (x < -maxX.value) {
      x = -maxX.value;
      vx.value = -vx.value * 0.7;
      squash("x", 1);
    }

    if (y > maxY.value) {
      y = maxY.value;
      vy.value = -vy.value * 0.7;
      squash("y", 0);
    } else if (y < minY.value) {
      y = minY.value;
      vy.value = -vy.value * 0.7;
      squash("y", 0);
    }

    tx.value = x;
    ty.value = y;
    rot.value = clamp(vx.value * 1.4, -25, 25);

    // почти остановились: один раз запускаем пружину в центр
    if (Math.abs(vx.value) < 0.2 && Math.abs(vy.value) < 0.2) {
      settling.value = true;
      tx.value = withSpring(0, { damping: 12, stiffness: 90 });
      ty.value = withSpring(0, { damping: 12, stiffness: 90 });
      rot.value = withSpring(0, { damping: 10 });
    }
  });

  // толчок от встряхивания телефона
  const addImpulse = useCallback(
    (ix: number, iy: number) => {
      runOnUI(() => {
        "worklet";
        if (touching.value) return;
        settling.value = false;
        cancelAnimation(tx);
        cancelAnimation(ty);
        vx.value += ix;
        vy.value += iy;
      })();
    },
    [touching, settling, tx, ty, vx, vy],
  );

  useEffect(() => {
    let sub: ReturnType<typeof Accelerometer.addListener> | undefined;
    let cancelled = false;
    let lastBuzz = 0;
    let prevX = 0;
    let prevY = 0;
    let primed = false; // первый замер не считаем рывком

    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelled) return;
        Accelerometer.setUpdateInterval(35);
        sub = Accelerometer.addListener(({ x, y }) => {
          const cx = SIGN_X * x;
          const cy = SIGN_Y * y;
          if (!primed) {
            prevX = cx;
            prevY = cy;
            primed = true;
            return;
          }
          const dx = cx - prevX;
          const dy = cy - prevY;
          prevX = cx;
          prevY = cy;

          const ix = Math.abs(dx) > 0.3 ? dx * 16 : 0;
          const iy = Math.abs(dy) > 0.3 ? dy * 16 : 0;
          if (ix || iy) addImpulse(ix, iy);

          const now = Date.now();
          if (Math.abs(dx) + Math.abs(dy) > 1.3 && now - lastBuzz > 500) {
            lastBuzz = now;
            react("cheer", 1000);
            buzz(Haptics.ImpactFeedbackStyle.Medium);
          }
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [react, addImpulse]);

  const charStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value + kick.value}deg` },
      { scaleX: sx.value },
      { scaleY: sy.value },
    ],
  }));

  const hint =
    mode === "pet"
      ? "Проведите пальцем по персонажу"
      : "Бросайте персонажа пальцем или потрясите телефон";

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[font.title, { color: colors.text, fontSize: 28 }]}>
            Передышка
          </Text>
          <Text style={{ color: colors.textMuted }}>{hint}.</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Закрыть"
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.stage} onLayout={onStageLayout}>
        <View style={{ width: SIZE, height: SIZE }}>
          {/* Розовое тепло за персонажем */}
          <View
            pointerEvents="none"
            style={[
              styles.warmGlow,
              {
                backgroundColor: colors.accent,
                opacity: Math.min(0.34, warmth * 0.045),
              },
            ]}
          />

          <GestureDetector gesture={gesture}>
            <Animated.View style={[{ width: SIZE, height: SIZE }, charStyle]}>
              <CharacterAvatar state={pose} size={SIZE} />
            </Animated.View>
          </GestureDetector>

          {hearts.map((h) => (
            <Heart
              key={h.id}
              x={h.x}
              onDone={() =>
                setHearts((list) => list.filter((i) => i.id !== h.id))
              }
            />
          ))}
        </View>

        <Text style={{ color: colors.textMuted, marginTop: 24 }}>
          Тепла: {warmth}
        </Text>
      </View>

      <View style={[styles.controls, { paddingBottom: 16 + insets.bottom }]}>
        <View style={styles.row}>
          <Chip
            label="Гладить"
            active={mode === "pet"}
            onPress={() => setMode("pet")}
          />
          <Chip
            label="Трясти"
            active={mode === "shake"}
            onPress={() => setMode("shake")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },

  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  warmGlow: {
    position: "absolute",
    left: 8,
    top: 8,
    width: SIZE - 16,
    height: SIZE - 16,
    borderRadius: SIZE,
  },

  controls: {
    paddingHorizontal: 20,
    gap: 12,
  },

  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },

  heart: {
    position: "absolute",
    top: 40,
  },
});
