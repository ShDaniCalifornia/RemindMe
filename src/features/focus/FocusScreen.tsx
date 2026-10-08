import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { ProgressRing } from '@/shared/components/ProgressRing';
import { useAppStore } from '@/store/useAppStore';
import { dateKey } from '@/shared/utils/date';
import { font } from '@/theme/tokens';

type Kind = 'pomodoro' | 'custom';
type Phase = 'idle' | 'work' | 'break';

const POMO = { work: 25, short: 5, long: 15, cyclesToLong: 4 };
const PRESETS = [15, 25, 45, 60];
// фокус всегда на тёмном фоне, независимо от темы приложения
const C = { bg: '#161513', text: '#EFEAE0', muted: '#A29E94', ring: '#93AE95', track: '#2C2A26', accent: '#EBA394', chip: '#2A2925' };

const awake = (on: boolean) => {
  try {
    Promise.resolve(on ? activateKeepAwakeAsync('focus') : deactivateKeepAwake('focus')).catch(() => {});
  } catch {
    // нет поддержки
  }
};
const buzz = (t: Haptics.NotificationFeedbackType) => { Haptics.notificationAsync(t).catch(() => {}); };

function DarkChip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: active ? C.ring : C.chip }]}>
      <Text style={{ color: active ? '#10150f' : C.text }}>{label}</Text>
    </Pressable>
  );
}

export function FocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId, title: titleParam, timer } = useLocalSearchParams<{ taskId?: string; title?: string; timer?: string }>();
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));
  const toggleTask = useAppStore((s) => s.toggleTask);
  const addFocusSession = useAppStore((s) => s.addFocusSession);
  const sessions = useAppStore((s) => s.focusSessions);
  const label = task?.title ?? titleParam ?? '';

  const [kind, setKind] = useState<Kind>(timer && timer !== 'pomodoro' ? 'custom' : 'pomodoro');
  const [customMin, setCustomMin] = useState(Number(timer) > 0 ? Number(timer) : 25);
  const [phase, setPhase] = useState<Phase>('idle');
  const [totalMs, setTotalMs] = useState(0);
  const [endAt, setEndAt] = useState(0);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [cycles, setCycles] = useState(0);
  const [doneWork, setDoneWork] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const handled = useRef(0);

  // Время считаем по моменту окончания (endAt), а не счётчиком секунд:
  // если приложение свернули, таймер не собьётся.
  const running = phase !== 'idle' && pausedLeft === null;
  const leftMs = phase === 'idle' ? 0 : pausedLeft ?? Math.max(0, endAt - now);

  const todayMinutes = sessions.filter((s) => dateKey(new Date(s.endedAt)) === dateKey()).reduce((a, s) => a + s.minutes, 0);

  const start = (p: 'work' | 'break', minutes: number) => {
    const ms = minutes * 60000;
    setPhase(p);
    setTotalMs(ms);
    setEndAt(Date.now() + ms);
    setNow(Date.now());
    setPausedLeft(null);
    setNote(null);
  };

  const workMinutes = () => (kind === 'pomodoro' ? POMO.work : customMin);

  const record = (minutes: number) => {
    if (minutes < 1) return;
    addFocusSession({ title: label || 'Фокус', taskId: task?.id, minutes });
    setDoneWork((m) => m + minutes);
  };

  const handleEnd = () => {
    buzz(Haptics.NotificationFeedbackType.Success);
    if (phase === 'work') {
      const minutes = Math.round(totalMs / 60000);
      record(minutes);
      const next = cycles + 1;
      setCycles(next);
      if (kind === 'pomodoro') {
        const breakMin = next % POMO.cyclesToLong === 0 ? POMO.long : POMO.short;
        start('break', breakMin);
        setNote(`Цикл готов. Перерыв ${breakMin} мин: встань, разомни плечи, выпей воды.`);
      } else {
        setPhase('idle');
        setNote(`Готово: ${minutes} мин фокуса.`);
      }
    } else {
      setPhase('idle');
      setNote('Перерыв закончился. Готова к следующему циклу?');
    }
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && leftMs <= 0 && handled.current !== endAt) {
      handled.current = endAt;
      handleEnd();
    }
  });

  useEffect(() => {
    awake(phase !== 'idle');
    return () => awake(false);
  }, [phase]);

  const pause = () => setPausedLeft(Math.max(0, endAt - Date.now()));
  const resume = () => {
    setEndAt(Date.now() + (pausedLeft ?? 0));
    setPausedLeft(null);
    setNow(Date.now());
  };

  const stopNow = () => {
    if (phase === 'work') {
      const elapsed = Math.floor((totalMs - leftMs) / 60000);
      record(elapsed);
      setNote(elapsed >= 1 ? `Засчитано ${elapsed} мин.` : null);
    }
    setPhase('idle');
    setPausedLeft(null);
  };

  const confirmStop = (then?: () => void) => {
    if (phase === 'idle') { then?.(); return; }
    Alert.alert('Остановить фокус?', phase === 'work' ? 'Уже отработанные минуты будут засчитаны.' : undefined, [
      { text: 'Продолжить', style: 'cancel' },
      { text: 'Остановить', style: 'destructive', onPress: () => { stopNow(); then?.(); } },
    ]);
  };

  const idleMinutes = workMinutes();
  const seconds = Math.ceil((phase === 'idle' ? idleMinutes * 60000 : leftMs) / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const progress = phase === 'idle' || !totalMs ? 0 : 1 - leftMs / totalMs;

  const title =
    phase === 'work' ? 'Работаем' : phase === 'break' ? 'Перерыв' : kind === 'pomodoro' ? `Pomodoro: ${POMO.work} / ${POMO.short} мин` : 'Свой таймер';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[font.title, { color: C.text, fontSize: 26 }]}>Фокус</Text>
          {label ? <Text style={{ color: C.muted }} numberOfLines={1}>{label}</Text> : null}
        </View>
        <Pressable onPress={() => confirmStop(() => router.back())} hitSlop={12} accessibilityLabel="Закрыть">
          <Ionicons name="close" size={26} color={C.text} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
          <View style={StyleSheet.absoluteFill}>
            <ProgressRing progress={progress} size={280} stroke={6} color={phase === 'break' ? C.accent : C.ring} trackColor={C.track} />
          </View>
          <CharacterAvatar state={phase === 'break' ? 'happy' : 'calm'} size={190} circle={false} />
        </View>
        <Text style={{ color: C.text, fontSize: 56, fontWeight: '300', marginTop: 16, fontVariant: ['tabular-nums'] }}>
          {mm}:{ss}
        </Text>
        <Text style={{ color: C.muted, fontSize: 16 }}>{title}</Text>
        {note && <Text style={{ color: C.text, textAlign: 'center', marginTop: 12, paddingHorizontal: 32 }}>{note}</Text>}
        {phase === 'idle' && todayMinutes > 0 && (
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Сегодня в фокусе: {todayMinutes} мин</Text>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: 16 + insets.bottom }]}>
        {phase === 'idle' ? (
          <>
            <View style={styles.row}>
              <DarkChip label="Pomodoro 25/5" active={kind === 'pomodoro'} onPress={() => setKind('pomodoro')} />
              <DarkChip label="Свой таймер" active={kind === 'custom'} onPress={() => setKind('custom')} />
            </View>
            {kind === 'custom' && (
              <>
                <View style={styles.row}>
                  {PRESETS.map((m) => (
                    <DarkChip key={m} label={`${m} мин`} active={customMin === m} onPress={() => setCustomMin(m)} />
                  ))}
                </View>
                <View style={[styles.row, { alignItems: 'center', gap: 20 }]}>
                  <Pressable onPress={() => setCustomMin((m) => Math.max(1, m - 5))} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
                  <Text style={{ color: C.text, fontSize: 18, minWidth: 80, textAlign: 'center' }}>{customMin} мин</Text>
                  <Pressable onPress={() => setCustomMin((m) => Math.min(180, m + 5))} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
                </View>
              </>
            )}
            {task && !task.done && doneWork > 0 && (
              <Pressable onPress={() => { toggleTask(task.id); setNote('Задача отмечена выполненной.'); }} style={[styles.big, { backgroundColor: C.chip }]}>
                <Text style={{ color: C.text, fontWeight: '600' }}>Отметить задачу выполненной</Text>
              </Pressable>
            )}
            <Pressable onPress={() => start('work', idleMinutes)} style={[styles.big, { backgroundColor: C.ring }]}>
              <Text style={{ color: '#10150f', fontWeight: '700', fontSize: 16 }}>
                {kind === 'pomodoro' && cycles > 0 ? 'Следующий цикл' : 'Начать фокус'}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.row}>
            <Pressable onPress={pausedLeft === null ? pause : resume} style={[styles.big, { backgroundColor: C.chip, flex: 1 }]}>
              <Text style={{ color: C.text, fontWeight: '600' }}>{pausedLeft === null ? 'Пауза' : 'Продолжить'}</Text>
            </Pressable>
            <Pressable onPress={() => confirmStop()} style={[styles.big, { backgroundColor: C.chip, flex: 1 }]}>
              <Text style={{ color: C.accent, fontWeight: '600' }}>Завершить</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { paddingHorizontal: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999 },
  big: { paddingVertical: 15, borderRadius: 999, alignItems: 'center' },
  step: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: C.text, fontSize: 22 },
});
