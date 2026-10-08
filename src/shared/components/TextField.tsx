import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function TextField({ label, style, ...props }: TextInputProps & { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
          props.multiline && { minHeight: 140, textAlignVertical: 'top' },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
});
