import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppPalette, AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLoanStore } from "@/store/useLoanStore";
import type { LoanType } from "@/db/types";

export default function AddLoanModal() {
  const db = useSQLiteContext();
  const { loanId } = useLocalSearchParams<{ loanId?: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const isEdit = !!loanId;

  const addLoan = useLoanStore((s) => s.addLoan);
  const editLoan = useLoanStore((s) => s.editLoan);
  const getLoanWithPayments = useLoanStore((s) => s.getLoanWithPayments);

  const [type, setType] = useState<LoanType>("given");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ person?: string; amount?: string }>({});

  useEffect(() => {
    if (isEdit && loanId) {
      getLoanWithPayments(db, loanId).then(({ loan }) => {
        if (loan) {
          setType(loan.type);
          setPersonName(loan.person_name);
          setAmount(String(loan.principal_amount));
          setDate(loan.date);
          setDueDate(loan.due_date ?? "");
          setNote(loan.note ?? "");
        }
      });
    }
  }, [isEdit, loanId]);

  function validate() {
    const e: typeof errors = {};
    if (!personName.trim()) e.person = "Name is required";
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) e.amount = "Enter a valid amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const n = parseFloat(amount);
      if (isEdit && loanId) {
        await editLoan(db, loanId, {
          personName: personName.trim(),
          note: note.trim() || undefined,
          date,
          dueDate: dueDate || null,
        });
      } else {
        await addLoan(db, {
          type,
          personName: personName.trim(),
          principalAmount: n,
          note: note.trim() || undefined,
          date,
          dueDate: dueDate || null,
        });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const isGiven = type === "given";
  const accentColor = isGiven ? AppPalette.teal : AppPalette.warning;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Handle bar */}
        <View style={styles.handleWrap}>
          <View
            style={[styles.handle, { backgroundColor: theme.border }]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {isEdit ? "Edit Loan" : "New Loan"}
          </Text>

          {/* Type selector — hide on edit */}
          {!isEdit && (
            <View>
              <Text style={[styles.label, { color: theme.textMuted }]}>
                Loan Type
              </Text>
              <View
                style={[
                  styles.typeRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Pressable
                  style={[
                    styles.typeBtn,
                    type === "given" && {
                      backgroundColor: AppPalette.teal,
                    },
                  ]}
                  onPress={() => setType("given")}
                >
                  <MaterialCommunityIcons
                    name="arrow-down-circle"
                    size={18}
                    color={type === "given" ? "#fff" : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.typeBtnLabel,
                      { color: type === "given" ? "#fff" : theme.textMuted },
                    ]}
                  >
                    I Lent Money
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeBtn,
                    type === "taken" && {
                      backgroundColor: AppPalette.warning,
                    },
                  ]}
                  onPress={() => setType("taken")}
                >
                  <MaterialCommunityIcons
                    name="arrow-up-circle"
                    size={18}
                    color={type === "taken" ? "#fff" : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.typeBtnLabel,
                      { color: type === "taken" ? "#fff" : theme.textMuted },
                    ]}
                  >
                    I Borrowed
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Person name */}
          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              {isGiven ? "Lent to" : "Borrowed from"}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.person ? AppPalette.danger : theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Person's name"
              placeholderTextColor={theme.textMuted}
              value={personName}
              onChangeText={(v) => {
                setPersonName(v);
                if (errors.person) setErrors((e) => ({ ...e, person: undefined }));
              }}
              autoCapitalize="words"
            />
            {errors.person && (
              <Text style={styles.errorText}>{errors.person}</Text>
            )}
          </View>

          {/* Amount — hide on edit */}
          {!isEdit && (
            <View>
              <Text style={[styles.label, { color: theme.textMuted }]}>
                Amount (PKR)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: errors.amount
                      ? AppPalette.danger
                      : theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                value={amount}
                onChangeText={(v) => {
                  setAmount(v);
                  if (errors.amount)
                    setErrors((e) => ({ ...e, amount: undefined }));
                }}
                keyboardType="numeric"
              />
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>
          )}

          {/* Date */}
          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Date
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Due date */}
          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Due Date{" "}
              <Text style={{ fontWeight: "400" }}>(optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>

          {/* Note */}
          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Note <Text style={{ fontWeight: "400" }}>(optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.noteInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="What's this loan for?"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnLabel}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Loan"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    padding: Layout.padding,
    gap: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  typeRow: {
    flexDirection: "row",
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  typeBtnLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "500",
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: AppPalette.danger,
    fontSize: 12,
    marginTop: 4,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: Layout.radiusSmall,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
