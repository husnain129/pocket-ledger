import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
};

export function Tag({ label, selected = false, onPress, color }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.tag,
        {
          backgroundColor: selected ? theme.text : theme.surfaceAlt,
          borderColor: selected ? theme.text : theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? theme.background : (color ?? theme.textMuted) },
        ]}
      >
        {label}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
