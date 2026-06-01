import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
  footer?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onActionPress,
  footer,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={32} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>
        {description}
      </Text>
      {actionLabel && onActionPress ? (
        <Pressable
          style={[styles.action, { backgroundColor: theme.primary }]}
          onPress={onActionPress}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  action: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 4,
  },
  actionLabel: {
    color: "#fff",
    fontWeight: "800",
  },
});
