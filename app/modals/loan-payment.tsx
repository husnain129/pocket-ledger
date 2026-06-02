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
import { formatMoney } from "@/db/queries";
import type { LoanPaymentRow, LoanRow } from "@/db/types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLoanStore } from "@/store/useLoanStore";

export default function LoanPaymentModal() {
  const db = useSQLiteContext();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  const getLoanWithPayments = useLoanStore((s) => s.getLoanWithPayments);
  const addPayment = useLoanStore((s) => s.addPayment);
  const setPaid = useLoanStore((s) => s.setPaid);
  const removeLoan = useLoanStore((s) => s.removeLoan);

  const [loan, setLoan] = useState<LoanRow | null>(null);
  const [payments, setPayments] = useState<LoanPaymentRow[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [markFullyPaid, setMarkFullyPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!loanId) return;
    const { loan: l, payments: p } = await getLoanWithPayments(db, loanId);
    setLoan(l);
    setPayments(p);
  }

  useEffect(() => {
    load();
  }, [loanId]);

  useEffect(() => {
    if (markFullyPaid && loan) {
      setAmount(String(loan.remaining_amount));
    }
  }, [markFullyPaid, loan]);

  async function handleRecord() {
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await addPayment(db, loanId, n, note.trim() || undefined, date, markFullyPaid);
      await load();
      setAmount("");
      setNote("");
      setMarkFullyPaid(false);
    } finally {
      setSaving(false);
    }
  }

  if (!loan) return null;

  const currency = "PKR";
  const isGiven = loan.type === "given";
  const isPaid = loan.status === "paid";
  const accentColor = isGiven ? AppPalette.teal : AppPalette.warning;
  const paidPct =
    loan.principal_amount > 0
      ? ((loan.principal_amount - loan.remaining_amount) / loan.principal_amount) * 100
      : 100;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Loan summary card */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.surface, borderColor: theme.border, borderLeftColor: accentColor },
            ]}
          >
            <View style={styles.summaryTop}>
              <View>
                <Text style={[styles.personName, { color: theme.text }]}>
                  {loan.person_name}
                </Text>
                <View
                  style={[
                    styles.typePill,
                    {
                      backgroundColor: isGiven
                        ? theme.primarySoft
                        : colorScheme === "dark"
                          ? "#2d1f04"
                          : "#fef3c7",
                    },
                  ]}
                >
                  <Text style={[styles.typePillText, { color: accentColor }]}>
                    {isGiven ? "Lent Out" : "Borrowed"}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.remainingLabel, { color: theme.textMuted }]}>
                  Remaining
                </Text>
                <Text style={[styles.remainingAmount, { color: accentColor }]}>
                  {formatMoney(loan.remaining_amount, currency)}
                </Text>
                <Text style={[styles.principalText, { color: theme.textMuted }]}>
                  of {formatMoney(loan.principal_amount, currency)}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: accentColor, width: `${Math.min(100, paidPct)}%` },
                ]}
              />
            </View>

            <View style={styles.progressLabels}>
              <Text style={[styles.progressText, { color: theme.textMuted }]}>
                {Math.round(paidPct)}% settled
              </Text>
              {loan.due_date && (
                <Text
                  style={[
                    styles.progressText,
                    {
                      color: dayjs(loan.due_date).isBefore(dayjs(), "day")
                        ? AppPalette.danger
                        : theme.textMuted,
                    },
                  ]}
                >
                  Due {dayjs(loan.due_date).format("MMM D, YYYY")}
                </Text>
              )}
            </View>

            {isPaid && (
              <View style={[styles.paidBanner, { backgroundColor: theme.primarySoft }]}>
                <MaterialCommunityIcons name="check-circle" size={16} color={theme.primary} />
                <Text style={[styles.paidBannerText, { color: theme.primary }]}>
                  Fully settled
                </Text>
              </View>
            )}
          </View>

          {/* Record payment — only if active */}
          {!isPaid && (
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Record Payment
              </Text>

              <View>
                <Text style={[styles.label, { color: theme.textMuted }]}>
                  Amount (PKR)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      borderColor: error ? AppPalette.danger : theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  value={amount}
                  onChangeText={(v) => {
                    setAmount(v);
                    setError("");
                    if (markFullyPaid) setMarkFullyPaid(false);
                  }}
                  keyboardType="numeric"
                />
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
              </View>

              <View>
                <Text style={[styles.label, { color: theme.textMuted }]}>Date</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View>
                <Text style={[styles.label, { color: theme.textMuted }]}>
                  Note <Text style={{ fontWeight: "400" }}>(optional)</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder="Payment note"
                  placeholderTextColor={theme.textMuted}
                  value={note}
                  onChangeText={setNote}
                />
              </View>

              {/* Mark fully paid toggle */}
              <Pressable
                style={styles.toggleRow}
                onPress={() => {
                  const next = !markFullyPaid;
                  setMarkFullyPaid(next);
                  if (next) setAmount(String(loan.remaining_amount));
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.border,
                      backgroundColor: markFullyPaid ? theme.primary : theme.surface,
                    },
                  ]}
                >
                  {markFullyPaid && (
                    <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  )}
                </View>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>
                  Mark as fully settled
                </Text>
              </Pressable>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: accentColor }]}
                onPress={handleRecord}
                disabled={saving}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="check" size={18} color="#fff" />
                <Text style={styles.saveBtnLabel}>
                  {saving ? "Recording…" : "Record Payment"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Payment history */}
          {payments.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Payment History
              </Text>
              <View style={styles.paymentList}>
                {payments.map((p) => (
                  <View
                    key={p.id}
                    style={[styles.paymentRow, { borderBottomColor: theme.border }]}
                  >
                    <View
                      style={[styles.paymentDot, { backgroundColor: accentColor }]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.paymentAmount, { color: theme.text }]}>
                        {formatMoney(p.amount, currency)}
                      </Text>
                      {p.note ? (
                        <Text style={[styles.paymentNote, { color: theme.textMuted }]}>
                          {p.note}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.paymentDate, { color: theme.textMuted }]}>
                      {dayjs(p.date).format("MMM D")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Delete loan */}
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: AppPalette.danger }]}
            onPress={async () => {
              await removeLoan(db, loanId);
              router.back();
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={AppPalette.danger} />
            <Text style={[styles.deleteBtnLabel, { color: AppPalette.danger }]}>
              Delete Loan
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  scroll: { padding: Layout.padding, gap: 14, paddingBottom: 48 },
  summaryCard: {
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 16,
    gap: 12,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  personName: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  typePillText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  remainingLabel: { fontSize: 11, fontWeight: "600", textAlign: "right" },
  remainingAmount: { fontSize: 22, fontWeight: "800", textAlign: "right" },
  principalText: { fontSize: 11, textAlign: "right" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: { fontSize: 12 },
  paidBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
  },
  paidBannerText: { fontSize: 14, fontWeight: "700" },
  section: {
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: { color: AppPalette.danger, fontSize: 12, marginTop: 4 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnLabel: { color: "#fff", fontSize: 15, fontWeight: "800" },
  paymentList: { gap: 0 },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paymentDot: { width: 8, height: 8, borderRadius: 4 },
  paymentAmount: { fontSize: 14, fontWeight: "700" },
  paymentNote: { fontSize: 12, marginTop: 1 },
  paymentDate: { fontSize: 12, fontWeight: "500" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteBtnLabel: { fontSize: 14, fontWeight: "700" },
});
