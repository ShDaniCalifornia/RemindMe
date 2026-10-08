import { Text as RNText, View as RNView } from 'react-native';
import type { TextProps, ViewProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function Text({ style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return <RNText style={[{ color: colors.text }, style]} {...rest} />;
}

export function View({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return <RNView style={[{ backgroundColor: colors.background }, style]} {...rest} />;
}
