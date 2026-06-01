import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

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
};

export function IncomeForm({
  initialValues,
  onSubmit,
  submitLabel = "Add income",
  loading = false,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const [amount, setAmount] = useState(String(initialValues?.amount ?? "0"));
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [date, setDate] = useState(
    initialValues?.date ?? new Date().toISOString().slice(0, 10),
  );

  async function handleSubmit() {
    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    await onSubmit({
      amount: parsedAmount,
      note: note.trim() || undefined,
      date,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.text }]}>
        Top up your budget
      </Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>
        Record bonuses, extra income, or mid-period cash injections without
        leaving the app.
      </Text>

      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        mode="outlined"
        keyboardType="decimal-pad"
        dense
      />
      <TextInput
        label="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        mode="outlined"
        dense
      />
      <TextInput
        label="Note"
        value={note}
        onChangeText={setNote}
        mode="outlined"
        dense
        multiline
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 6,
    borderRadius: Layout.radiusSmall,
  },
});
