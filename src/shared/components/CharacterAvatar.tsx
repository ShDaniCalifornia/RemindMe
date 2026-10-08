import { Image, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/theme/useTheme';
import { CharacterState, finalLottie, placeholderLottie, stillImages } from './characterAssets';

export type { CharacterState } from './characterAssets';

type Props = {
  state?: CharacterState;
  size?: number;
  circle?: boolean;
  loop?: boolean; // false для одноразовых реакций (радость после закрытой привычки)
};

export function CharacterAvatar({ state = 'calm', size = 120, circle = true, loop = true }: Props) {
  const { colors } = useTheme();
  const real = finalLottie[state];
  const still = stillImages[state];

  let content;
  if (real) {
    content = <LottieView key={`f-${state}`} source={real} autoPlay loop={loop} style={{ width: size, height: size }} />;
  } else if (still) {
    content = <Image source={still} style={{ width: size, height: size }} resizeMode="contain" />;
  } else {
    content = (
      <LottieView key={`p-${state}`} source={placeholderLottie[state]} autoPlay loop={loop} style={{ width: size, height: size }} />
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        circle && { backgroundColor: colors.primarySoft },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' } });
