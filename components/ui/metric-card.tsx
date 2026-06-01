import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone?: "primary" | "warning" | "danger" | "success" | "secondary";
  children?: ReactNode;
};

export function MetricCard({
  label,
  value,
  sublabel,
  icon,
  tone = "primary",
  children,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  const toneColor =
    tone === "warning"
      ? theme.warning
      : tone === "danger"
        ? theme.danger
        : tone === "success"
          ? theme.success
          : tone === "secondary"
            ? theme.secondary
            : theme.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${toneColor}22` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={toneColor} />
        </View>
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: theme.textMuted }]}>
          {sublabel}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Layout.radius,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
  },
  sublabel: {
    fontSize: 13,
    lineHeight: 18,
  },
});
