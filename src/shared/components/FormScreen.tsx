import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { useKeyboardVisible } from '@/shared/hooks/useKeyboardVisible';
import { font } from '@/theme/tokens';

// Каркас модальных форм: заголовок + крестик, скролл, кнопки закреплены над клавиатурой
export function FormScreen({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardVisible();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={styles.head}>
          <Text style={[font.title, { color: colors.text, fontSize: 26, flex: 1 }]}>{title}</Text>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Закрыть">
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: kb ? 12 : 12 + insets.bottom, borderColor: colors.border }]}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
