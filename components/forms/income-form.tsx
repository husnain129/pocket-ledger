import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { Button } from "react-native-paper";

import { getCurrencySymbol } from "@/constants/currencies";
import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type IncomeFormValues = {
  amount: number;
  note?: string;
  date: string;
};

type Props = {
  initialValues?: IncomeFormValues;
  onSubmit: (values: IncomeFormValues) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
  currency?: string;
};

function buildDateRange() {
  const dates: Array<{ date: string; dayLetter: string; dayNum: number }> = [];
  const today = new Date();
  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push({
      date: d.toISOString().slice(0, 10),
      dayLetter: DAY_LETTERS[d.getDay()],
      dayNum: d.getDate(),
    });
  }
  return dates;
}

const SOURCE_SUGGESTIONS = [
  { label: "Salary", icon: "briefcase-outline" },
  { label: "Freelance", icon: "laptop" },
  { label: "Bonus", icon: "star-outline" },
  { label: "Gift", icon: "gift-outline" },
  { label: "Rental", icon: "home-outline" },
  { label: "Investment", icon: "trending-up" },
  { label: "Refund", icon: "cash-refund" },
  { label: "Other", icon: "dots-horizontal-circle-outline" },
] as const;

export function IncomeForm({
  initialValues,
  onSubmit,
  submitLabel = "Add Funds",
  loading = false,
  currency = "PKR",
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  const [amount, setAmount] = useState(
    initialValues?.amount ? String(initialValues.amount) : "",
  );
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [date, setDate] = useState(
    initialValues?.date ?? new Date().toISOString().slice(0, 10),
  );

  const dates = useMemo(() => buildDateRange(), []);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = dates.findIndex((d) => d.date === date);
    if (idx >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, idx - 3) * 52, animated: false });
      }, 50);
    }
  }, []);

  async function handleSubmit() {
    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    await onSubmit({ amount: parsed, note: note.trim() || undefined, date });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Add Funds</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Top up your balance with salary, bonuses, or any extra income.
        </Text>
      </View>

      {/* Date picker */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Date</Text>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datePickerContent}
        >
          {dates.map((d) => {
            const isSelected = d.date === date;
            return (
              <Pressable
                key={d.date}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDate(d.date);
                }}
                style={[
                  styles.datePill,
                  {
                    backgroundColor: isSelected ? theme.text : theme.surfaceAlt,
                    borderColor: isSelected ? theme.text : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.datePillLetter,
                    { color: isSelected ? theme.background : theme.textMuted },
                  ]}
                >
                  {d.dayLetter}
                </Text>
                <Text
                  style={[
                    styles.datePillNum,
                    { color: isSelected ? theme.background : theme.text },
                  ]}
                >
                  {d.dayNum}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Amount */}
      <View style={styles.amountSection}>
        <Text style={[styles.currencyLabel, { color: theme.textMuted }]}>{getCurrencySymbol(currency)}</Text>
        <RNTextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={theme.border}
          keyboardType="decimal-pad"
          style={[styles.amountInput, { color: theme.text }]}
          selectionColor={theme.secondary}
        />
      </View>

      {/* Source suggestions */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Source</Text>
        <View style={styles.sourcesGrid}>
          {SOURCE_SUGGESTIONS.map((s) => {
            const isSelected = note === s.label;
            return (
              <Pressable
                key={s.label}
                onPress={() => {
                  Haptics.selectionAsync();
                  setNote(isSelected ? "" : s.label);
                }}
                style={[
                  styles.sourceChip,
                  {
                    backgroundColor: isSelected ? theme.text : theme.surfaceAlt,
                    borderColor: isSelected ? theme.text : theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={s.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={16}
                  color={isSelected ? theme.background : theme.textMuted}
                />
                <Text
                  style={[
                    styles.sourceChipLabel,
                    { color: isSelected ? theme.background : theme.textMuted },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Custom note */}
      <View
        style={[
          styles.noteWrap,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <MaterialCommunityIcons
          name="pencil-outline"
          size={18}
          color={theme.textMuted}
        />
        <RNTextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note (optional)"
          placeholderTextColor={theme.border}
          style={[styles.noteInput, { color: theme.text }]}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={[styles.submitBtn, { backgroundColor: theme.text }]}
        contentStyle={styles.submitBtnContent}
        labelStyle={[styles.submitBtnLabel, { color: theme.background }]}
      >
        {submitLabel}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 40,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  datePickerContent: {
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    width: 44,
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  datePillLetter: {
    fontSize: 11,
    fontWeight: "700",
  },
  datePillNum: {
    fontSize: 17,
    fontWeight: "800",
  },
  amountSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  currencyLabel: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -2,
    minWidth: 120,
    textAlign: "center",
  },
  sourcesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  sourceChipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  noteWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteInput: {
    flex: 1,
    fontSize: 15,
  },
  submitBtn: {
    borderRadius: Layout.radiusSmall,
  },
  submitBtnContent: {
    height: 52,
  },
  submitBtnLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
});
