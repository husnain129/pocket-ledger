import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { Button, Divider, Switch, TextInput } from "react-native-paper";

import { PAYMENT_METHODS, RECURRING_RULES } from "@/constants/categories";
import { getCurrencySymbol } from "@/constants/currencies";
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
  const parents = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter((c) => c.parent_id);
  return { parents, subcategories };
}

function buildDateRange() {
  const dates: Array<{
    date: string;
    dayLetter: string;
    dayNum: number;
  }> = [];
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

type DatePickerProps = {
  value: string;
  onChange: (date: string) => void;
};

function DatePicker({ value, onChange }: DatePickerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const scrollRef = useRef<ScrollView>(null);
  const dates = useMemo(() => buildDateRange(), []);

  useEffect(() => {
    const idx = dates.findIndex((d) => d.date === value);
    if (idx >= 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, idx - 3) * 52, animated: false });
      }, 50);
    }
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.datePickerContent}
    >
      {dates.map((d) => {
        const isSelected = d.date === value;
        return (
          <Pressable
            key={d.date}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(d.date);
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
  );
}

type CategoryGridProps = {
  categories: CategoryRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const parents = categories.filter((c) => !c.parent_id);

  return (
    <View style={styles.categoryGrid}>
      {parents.map((cat) => {
        const isSelected = selectedId === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(cat.id);
            }}
            style={styles.categoryCell}
          >
            <View
              style={[
                styles.categoryIconWrap,
                {
                  backgroundColor: isSelected ? cat.color : `${cat.color}22`,
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: cat.color,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={22}
                color={isSelected ? "#fff" : cat.color}
              />
            </View>
            <Text
              style={[
                styles.categoryLabel,
                {
                  color: isSelected ? theme.text : theme.textMuted,
                  fontWeight: isSelected ? "800" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
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

  const [amount, setAmount] = useState(String(initialValues?.amount ?? ""));
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId);
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
    () => parents.find((c) => c.id === categoryId) ?? parents[0] ?? null,
    [categoryId, parents],
  );

  const availableSubcategories = useMemo(
    () => subcategories.filter((s) => s.parent_id === selectedParent?.id),
    [selectedParent, subcategories],
  );

  async function handlePickReceipt() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
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
    if (!categoryId || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
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
      keyboardShouldPersistTaps="handled"
    >
      {/* Form title */}
      <View style={styles.formHeader}>
        <Text style={[styles.formTitle, { color: theme.text }]}>
          {initialValues?.id ? "Edit expense" : "Add Transaction"}
        </Text>
        <Text style={[styles.formSubtitle, { color: theme.textMuted }]}>
          {budgetLabel}
        </Text>
      </View>

      {/* Date picker */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Date
        </Text>
        <DatePicker value={date} onChange={setDate} />
        <TextInput
          label="Time (HH:mm)"
          value={time}
          onChangeText={setTime}
          mode="outlined"
          dense
          style={styles.timeInput}
        />
      </View>

      {/* Amount */}
      <View style={styles.amountSection}>
        <Text style={[styles.currencySymbol, { color: theme.textMuted }]}>
          {getCurrencySymbol(currency)}
        </Text>
        <RNTextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={theme.border}
          keyboardType="decimal-pad"
          style={[styles.amountInput, { color: theme.text }]}
          selectionColor={theme.primary}
        />
      </View>

      {/* Category grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Category
        </Text>
        <CategoryGrid
          categories={categories}
          selectedId={categoryId}
          onSelect={(id) => {
            setCategoryId(id);
            setSubcategoryId(null);
          }}
        />
      </View>

      {/* Subcategories */}
      {availableSubcategories.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            Subcategory
          </Text>
          <View style={styles.subCatRow}>
            {availableSubcategories.map((sub) => {
              const isSelected = subcategoryId === sub.id;
              return (
                <Pressable
                  key={sub.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSubcategoryId(isSelected ? null : sub.id);
                  }}
                  style={[
                    styles.subCatChip,
                    {
                      backgroundColor: isSelected
                        ? sub.color
                        : `${sub.color}18`,
                      borderColor: isSelected ? sub.color : theme.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      sub.icon as keyof typeof MaterialCommunityIcons.glyphMap
                    }
                    size={14}
                    color={isSelected ? "#fff" : sub.color}
                  />
                  <Text
                    style={[
                      styles.subCatLabel,
                      { color: isSelected ? "#fff" : theme.textMuted },
                    ]}
                  >
                    {sub.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Notes */}
      <View
        style={[
          styles.notesWrap,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <Pressable
          style={[
            styles.noteEmojiBtn,
            { backgroundColor: theme.surface },
          ]}
          onPress={() => {}}
        >
          <MaterialCommunityIcons
            name="emoticon-outline"
            size={22}
            color={theme.textMuted}
          />
        </Pressable>
        <RNTextInput
          value={note}
          onChangeText={setNote}
          placeholder="Enter your reason"
          placeholderTextColor={theme.border}
          style={[styles.notesInput, { color: theme.text }]}
          multiline
        />
      </View>

      {/* Payment method */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Payment method
        </Text>
        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method;
            return (
              <Pressable
                key={method}
                onPress={() => setPaymentMethod(method)}
                style={[
                  styles.paymentChip,
                  {
                    backgroundColor: isSelected
                      ? theme.text
                      : theme.surfaceAlt,
                    borderColor: isSelected ? theme.text : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paymentChipLabel,
                    {
                      color: isSelected ? theme.background : theme.textMuted,
                    },
                  ]}
                >
                  {method}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Receipt */}
      <View style={styles.receiptRow}>
        <Button mode="outlined" onPress={handlePickReceipt} icon="receipt">
          {receiptUri ? "Receipt attached" : "Add receipt photo"}
        </Button>
        {receiptUri && (
          <Pressable onPress={() => setReceiptUri(null)}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.textMuted}
            />
          </Pressable>
        )}
      </View>
      {receiptUri && (
        <Image source={{ uri: receiptUri }} style={styles.receiptPreview} />
      )}

      {/* Recurring */}
      <View
        style={[
          styles.recurringRow,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.recurringTitle, { color: theme.text }]}>
            Recurring expense
          </Text>
          <Text style={[styles.recurringSubtitle, { color: theme.textMuted }]}>
            Auto-log when it comes due
          </Text>
        </View>
        <Switch value={isRecurring} onValueChange={setIsRecurring} />
      </View>

      {isRecurring && (
        <View style={styles.paymentRow}>
          {RECURRING_RULES.map((rule) => {
            const isSelected = recurrenceRule === rule;
            return (
              <Pressable
                key={rule}
                onPress={() => setRecurrenceRule(rule)}
                style={[
                  styles.paymentChip,
                  {
                    backgroundColor: isSelected ? theme.text : theme.surfaceAlt,
                    borderColor: isSelected ? theme.text : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paymentChipLabel,
                    { color: isSelected ? theme.background : theme.textMuted },
                  ]}
                >
                  {rule}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Divider />

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

      {onDelete && (
        <Button mode="text" textColor={theme.danger} onPress={onDelete}>
          Delete expense
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 40,
  },
  formHeader: {
    gap: 4,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
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
  timeInput: {
    marginTop: -4,
  },
  amountSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  currencySymbol: {
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    marginHorizontal: -4,
  },
  categoryCell: {
    width: "25%",
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: "center",
    gap: 6,
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  subCatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subCatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  subCatLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  notesWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    padding: 12,
  },
  noteEmojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  notesInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    paddingTop: 8,
  },
  paymentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  paymentChipLabel: {
    fontSize: 12,
    fontWeight: "700",
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
  recurringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
  },
  recurringTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  recurringSubtitle: {
    fontSize: 13,
    marginTop: 2,
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
