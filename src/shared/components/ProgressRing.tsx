import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/useTheme';

type Props = { progress: number; size?: number; color?: string; label?: string; trackColor?: string; stroke?: number };

export function ProgressRing({ progress, size = 48, color, label, trackColor, stroke = 5 }: Props) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor ?? colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color ?? colors.primary} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
        />
      </Svg>
      {label !== undefined && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={{ color: colors.text, fontSize: size * 0.3, fontWeight: '600' }}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
