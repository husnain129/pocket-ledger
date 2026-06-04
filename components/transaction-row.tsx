import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/theme";
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

function formatTime12h(time: string): string {
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${period}`;
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[parseInt(parts[1], 10) - 1] ?? parts[1];
  return `${parseInt(parts[2], 10)} ${month}`;
}

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
    expense.subcategory_color ?? expense.category_color ?? theme.secondary;
  const icon = expense.subcategory_icon ?? expense.category_icon ?? "cash";
  const title =
    expense.subcategory_name ?? expense.category_name ?? "Uncategorized";
  const timeLabel = formatTime12h(expense.time);
  const dateLabel = formatDateShort(expense.date);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
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
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.textMuted }]}
          numberOfLines={1}
        >
          {timeLabel} · {dateLabel}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.amount, { color: theme.secondary }]}>
          -{formatMoney(expense.amount, currency)}
        </Text>
        <Text
          style={[styles.paymentMethod, { color: theme.textMuted }]}
          numberOfLines={1}
        >
          {expense.payment_method}
        </Text>
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
    borderRadius: 16,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 1,
    elevation: 3,
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
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
  },
  amountColumn: {
    alignItems: "flex-end",
    gap: 3,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
  },
  paymentMethod: {
    fontSize: 11,
  },
});
