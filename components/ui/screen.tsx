import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: object;
};

export function Screen({ children, scrollable = true, contentStyle }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  if (!scrollable) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: theme.background }]}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.background },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.padding,
    gap: Layout.gap,
  },
  content: {
    flex: 1,
    padding: Layout.padding,
    gap: Layout.gap,
  },
});
