import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { Button } from '@/shared/components/Button';
import { useTheme } from '@/theme/useTheme';
import { font } from '@/theme/tokens';

const PHASES = [
  { label: 'Вдох', ms: 4000, to: 1 },
  { label: 'Задержка', ms: 4000, to: 1 },
  { label: 'Выдох', ms: 6000, to: 0.6 },
];
const CYCLES = 6;

export function BreathingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.6);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    const p = PHASES[phase];
    scale.value = withTiming(p.to, { duration: p.ms, easing: Easing.inOut(Easing.quad) });
    const t = setTimeout(() => {
      if (phase === PHASES.length - 1) {
        if (cycle + 1 >= CYCLES) {
          setRunning(false);
          setDone(true);
          setCycle(0);
          setPhase(0);
          return;
        }
        setCycle((c) => c + 1);
      }
      setPhase((i) => (i + 1) % PHASES.length);
    }, p.ms);
    return () => clearTimeout(t);
  }, [running, phase, cycle]);

  const begin = () => { setDone(false); setPhase(0); setCycle(0); scale.value = 0.6; setRunning(true); };
  const stop = () => { setRunning(false); setPhase(0); setCycle(0); scale.value = withTiming(0.6, { duration: 600 }); };

  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[font.title, { color: colors.text, fontSize: 28 }]}>Дыхание</Text>
          <Text style={{ color: colors.textMuted }}>Вдох 4 · пауза 4 · выдох 6. Дышите вместе с кругом.</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Закрыть">
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[styles.circle, { backgroundColor: colors.primarySoft }, circle]} />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.avatar}>
              <CharacterAvatar state={done ? 'happy' : 'calm'} size={130} circle={false} />
            </View>
          </View>
        </View>
        <Text style={{ color: colors.text, fontSize: 28, marginTop: 24 }}>
          {done ? 'Готово' : running ? PHASES[phase].label : 'Готовы?'}
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          {done ? 'Как вы себя чувствуете? Можно записать это в дневник.' : running ? `Круг ${cycle + 1} из ${CYCLES}` : `${CYCLES} кругов, около 2 минут`}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 + insets.bottom, gap: 8 }}>
        {running ? <Button title="Остановить" variant="ghost" onPress={stop} /> : <Button title={done ? 'Ещё раз' : 'Начать'} onPress={begin} />}
        {done && <Button title="Закрыть" variant="ghost" onPress={() => router.back()} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 280, height: 280, borderRadius: 140 },
  avatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
