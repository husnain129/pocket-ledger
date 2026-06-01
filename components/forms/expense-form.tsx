import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";

import { Tag } from "@/components/ui/tag";
import { PAYMENT_METHODS, RECURRING_RULES } from "@/constants/categories";
import { AppTheme, Layout } from "@/constants/theme";
import type { CategoryRow, ExpenseView } from "@/db/types";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type ExpenseFormValues = {
  amount: number;
  categoryId: string | null;
  subcategoryId: string | null;
  note?: string;
  date: string;
  time: string;
  paymentMethod: string;
  receiptUri?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
};

type Props = {
  categories: CategoryRow[];
  budgetLabel: string;
  currency: string;
  initialValues?: Partial<ExpenseView>;
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
};

function getCurrentTime() {
  return new Date().toISOString().slice(11, 16);
}

function groupCategories(categories: CategoryRow[]) {
  const parents = categories.filter((category) => !category.parent_id);
  const subcategories = categories.filter((category) => category.parent_id);
  return { parents, subcategories };
}

export function ExpenseForm({
  categories,
  budgetLabel,
  currency,
  initialValues,
  onSubmit,
  onDelete,
  submitLabel = "Save expense",
  loading = false,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const { parents, subcategories } = groupCategories(categories);
  const initialCategoryId =
    initialValues?.category_id ?? parents[0]?.id ?? null;
  const [amount, setAmount] = useState(String(initialValues?.amount ?? "0"));
  const [categoryId, setCategoryId] = useState<string | null>(
    initialCategoryId,
  );
  const [subcategoryId, setSubcategoryId] = useState<string | null>(
    initialValues?.subcategory_id ?? null,
  );
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [date, setDate] = useState(
    initialValues?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState(initialValues?.time ?? getCurrentTime());
  const [paymentMethod, setPaymentMethod] = useState(
    initialValues?.payment_method ?? PAYMENT_METHODS[0],
  );
  const [receiptUri, setReceiptUri] = useState(
    initialValues?.receipt_uri ?? null,
  );
  const [isRecurring, setIsRecurring] = useState(
    Boolean(initialValues?.is_recurring),
  );
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(
    initialValues?.recurrence_rule ?? null,
  );

  const selectedParent = useMemo(
    () =>
      parents.find((category) => category.id === categoryId) ??
      parents[0] ??
      null,
    [categoryId, parents],
  );

  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.parent_id === selectedParent?.id,
      ),
    [selectedParent, subcategories],
  );

  async function handlePickReceipt() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    const parsedAmount = Number.parseFloat(amount);
    if (!categoryId || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    await onSubmit({
      amount: parsedAmount,
      categoryId,
      subcategoryId,
      note: note.trim() || undefined,
      date,
      time,
      paymentMethod,
      receiptUri,
      isRecurring,
      recurrenceRule: isRecurring ? (recurrenceRule ?? "monthly") : null,
    });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.text }]}>Add expense</Text>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          {budgetLabel} budget, {currency}
        </Text>
      </View>

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
        label="Time (HH:mm)"
        value={time}
        onChangeText={setTime}
        mode="outlined"
        dense
      />

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Category
        </Text>
        <View style={styles.tagWrap}>
          {parents.map((category) => (
            <Tag
              key={category.id}
              label={category.name}
              selected={categoryId === category.id}
              onPress={() => {
                Haptics.selectionAsync();
                setCategoryId(category.id);
                setSubcategoryId(null);
              }}
            />
          ))}
        </View>
      </View>

      {availableSubcategories.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            Subcategory
          </Text>
          <View style={styles.tagWrap}>
            {availableSubcategories.map((subcategory) => (
              <Tag
                key={subcategory.id}
                label={subcategory.name}
                selected={subcategoryId === subcategory.id}
                onPress={() => setSubcategoryId(subcategory.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Payment method
        </Text>
        <View style={styles.tagWrap}>
          {PAYMENT_METHODS.map((item) => (
            <Tag
              key={item}
              label={item}
              selected={paymentMethod === item}
              onPress={() => setPaymentMethod(item)}
            />
          ))}
        </View>
      </View>

      <TextInput
        label="Note"
        value={note}
        onChangeText={setNote}
        mode="outlined"
        multiline
        dense
      />

      <View style={styles.receiptRow}>
        <Button mode="outlined" onPress={handlePickReceipt} icon="receipt">
          {receiptUri ? "Receipt attached" : "Add receipt photo"}
        </Button>
        {receiptUri ? (
          <IconButton
            icon="close-circle"
            size={20}
            onPress={() => setReceiptUri(null)}
          />
        ) : null}
      </View>

      {receiptUri ? (
        <Image source={{ uri: receiptUri }} style={styles.receiptPreview} />
      ) : null}

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.switchTitle, { color: theme.text }]}>
            Recurring expense
          </Text>
          <Text style={[styles.switchText, { color: theme.textMuted }]}>
            Auto-log it when it comes due.
          </Text>
        </View>
        <Switch value={isRecurring} onValueChange={setIsRecurring} />
      </View>

      {isRecurring ? (
        <View style={styles.tagWrap}>
          {RECURRING_RULES.map((rule) => (
            <Tag
              key={rule}
              label={rule}
              selected={recurrenceRule === rule}
              onPress={() => setRecurrenceRule(rule)}
            />
          ))}
        </View>
      ) : null}

      <Divider />
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {submitLabel}
      </Button>
      {onDelete ? (
        <Button mode="text" textColor={theme.danger} onPress={onDelete}>
          Delete expense
        </Button>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 32,
  },
  header: {
    gap: 4,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  receiptPreview: {
    width: "100%",
    height: 180,
    borderRadius: Layout.radius,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  switchText: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    borderRadius: Layout.radiusSmall,
  },
});
