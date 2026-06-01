import { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";

import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type BudgetFormValues = {
  label: string;
  totalAmount: number;
  startDate: string;
  endDate: string | null;
  currency: string;
};

type Props = {
  initialValues?: BudgetFormValues;
  currencies: string[];
  onSubmit: (values: BudgetFormValues) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
};

const defaultCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

export function BudgetForm({
  initialValues,
  currencies = defaultCurrencies,
  onSubmit,
  submitLabel = "Save budget",
  loading = false,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const [label, setLabel] = useState(initialValues?.label ?? "Monthly budget");
  const [totalAmount, setTotalAmount] = useState(
    String(initialValues?.totalAmount ?? "0"),
  );
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? null);
  const [currency, setCurrency] = useState(initialValues?.currency ?? "USD");
  const [periodType, setPeriodType] = useState<
    "monthly" | "custom" | "one-time"
  >(
    initialValues?.endDate && initialValues.endDate !== initialValues.startDate
      ? "custom"
      : "monthly",
  );

  const derivedEndDate = useMemo(() => {
    if (periodType === "one-time") {
      return startDate;
    }

    if (periodType === "monthly") {
      const current = new Date(`${startDate}T00:00:00`);
      current.setMonth(current.getMonth() + 1);
      return current.toISOString().slice(0, 10);
    }

    return endDate;
  }, [endDate, periodType, startDate]);

  async function handleSubmit() {
    const parsedAmount = Number.parseFloat(totalAmount);
    if (!label.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    await onSubmit({
      label: label.trim(),
      totalAmount: parsedAmount,
      startDate,
      endDate: derivedEndDate,
      currency,
    });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: theme.text }]}>
        Set your budget
      </Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>
        Create a period, set the starting amount, and keep your balance visible
        at all times.
      </Text>

      <TextInput
        label="Budget label"
        value={label}
        onChangeText={setLabel}
        mode="outlined"
        dense
      />
      <TextInput
        label="Budget amount"
        value={totalAmount}
        onChangeText={setTotalAmount}
        mode="outlined"
        keyboardType="decimal-pad"
        dense
      />
      <TextInput
        label="Start date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        mode="outlined"
        dense
      />

      {periodType === "custom" ? (
        <TextInput
          label="End date (YYYY-MM-DD)"
          value={endDate ?? ""}
          onChangeText={setEndDate}
          mode="outlined"
          dense
        />
      ) : null}

      <SegmentedButtons
        value={periodType}
        onValueChange={(value) =>
          setPeriodType(value as "monthly" | "custom" | "one-time")
        }
        buttons={[
          { value: "monthly", label: "Monthly" },
          { value: "custom", label: "Custom" },
          { value: "one-time", label: "One-time" },
        ]}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {submitLabel}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  button: {
    marginTop: 6,
    borderRadius: Layout.radiusSmall,
  },
});
