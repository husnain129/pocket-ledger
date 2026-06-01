import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme, Layout } from "@/constants/theme";
import { formatMoney } from "@/db/queries";
import type { ExpenseView } from "@/db/types";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  expense: ExpenseView;
  currency: string;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
};

export function TransactionRow({
  expense,
  currency,
  onPress,
  onLongPress,
  selected = false,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const color =
    expense.subcategory_color ?? expense.category_color ?? theme.primary;
  const icon = expense.subcategory_icon ?? expense.category_icon ?? "cash";
  const title =
    expense.subcategory_name ?? expense.category_name ?? "Uncategorized";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color={color}
        />
      </View>
      <View style={styles.textColumn}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {expense.is_recurring ? (
            <Text style={[styles.badge, { color: theme.primary }]}>
              Recurring
            </Text>
          ) : null}
        </View>
        <Text
          style={[styles.subtitle, { color: theme.textMuted }]}
          numberOfLines={1}
        >
          {expense.note || expense.payment_method} • {expense.date}{" "}
          {expense.time}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.amount, { color: theme.text }]}>
          {formatMoney(expense.amount, currency)}
        </Text>
        {expense.receipt_uri ? (
          <MaterialCommunityIcons
            name="receipt"
            size={16}
            color={theme.primary}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
  },
  amountColumn: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
  },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
