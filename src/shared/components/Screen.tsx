import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

// Общая обёртка вкладок: отступ сверху под статус-бар + фон + скролл
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <Body
        style={styles.flex}
        {...(scroll
          ? { contentContainerStyle: styles.content, showsVerticalScrollIndicator: false }
          : {})}
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  // большой нижний отступ, чтобы плавающая кнопка не закрывала контент
  content: { paddingHorizontal: 20, paddingBottom: 140, gap: 16 },
});
