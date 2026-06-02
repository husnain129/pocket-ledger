import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppPalette, AppTheme, Layout } from "@/constants/theme";
import { formatMoney } from "@/db/queries";
import type { LoanRow } from "@/db/types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLoanStore } from "@/store/useLoanStore";

export default function LoansScreen() {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  const loans = useLoanStore((s) => s.loans);
  const activeFilter = useLoanStore((s) => s.activeFilter);
  const hydrate = useLoanStore((s) => s.hydrate);
  const setFilter = useLoanStore((s) => s.setFilter);
  const setPaid = useLoanStore((s) => s.setPaid);
  const setActive = useLoanStore((s) => s.setActive);
  const removeLoan = useLoanStore((s) => s.removeLoan);

  useEffect(() => {
    hydrate(db);
  }, [db, hydrate]);

  const filtered =
    activeFilter === "all"
      ? loans
      : loans.filter((l) => l.type === activeFilter);

  const totalOwedToMe = loans
    .filter((l) => l.type === "given" && l.status === "active")
    .reduce((sum, l) => sum + l.remaining_amount, 0);

  const totalIOwe = loans
    .filter((l) => l.type === "taken" && l.status === "active")
    .reduce((sum, l) => sum + l.remaining_amount, 0);

  const currency = "PKR";

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Loans</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() =>
            router.push({
              pathname: "/modals/add-loan" as never,
              params: activeFilter !== "all" ? { type: activeFilter } : {},
            })
          }
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderLeftColor: AppPalette.teal,
              },
            ]}
          >
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-down-circle"
                size={20}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              You're Owed
            </Text>
            <Text style={[styles.summaryAmount, { color: theme.primary }]}>
              {formatMoney(totalOwedToMe, currency)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderLeftColor: AppPalette.warning,
              },
            ]}
          >
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: colorScheme === "dark" ? "#2d1f04" : "#fef3c7" },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-up-circle"
                size={20}
                color={AppPalette.warning}
              />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              You Owe
            </Text>
            <Text
              style={[styles.summaryAmount, { color: AppPalette.warning }]}
            >
              {formatMoney(totalIOwe, currency)}
            </Text>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={[styles.filterRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(["all", "given", "taken"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterTab,
                activeFilter === f && {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color:
                      activeFilter === f ? "#fff" : theme.textMuted,
                  },
                ]}
              >
                {f === "all" ? "All" : f === "given" ? "Lent Out" : "Borrowed"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Loan list */}
        {filtered.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <MaterialCommunityIcons
                name="handshake"
                size={32}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No loans yet
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
              Track money you've lent or borrowed. Tap + to add a loan.
            </Text>
            <Pressable
              style={[styles.emptyAction, { backgroundColor: theme.primary }]}
              onPress={() =>
                router.push({
                  pathname: "/modals/add-loan" as never,
                  params: activeFilter !== "all" ? { type: activeFilter } : {},
                })
              }
            >
              <Text style={styles.emptyActionLabel}>Add Loan</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                currency={currency}
                onPress={() =>
                  router.push({
                    pathname: "/modals/loan-payment" as never,
                    params: { loanId: loan.id },
                  })
                }
                onMarkPaid={() => setPaid(db, loan.id)}
                onMarkActive={() => setActive(db, loan.id)}
                onDelete={() => removeLoan(db, loan.id)}
                onEdit={() =>
                  router.push({
                    pathname: "/modals/add-loan" as never,
                    params: { loanId: loan.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LoanCard({
  loan,
  currency,
  onPress,
  onMarkPaid,
  onMarkActive,
  onDelete,
  onEdit,
}: {
  loan: LoanRow;
  currency: string;
  onPress: () => void;
  onMarkPaid: () => void;
  onMarkActive: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const isGiven = loan.type === "given";
  const isPaid = loan.status === "paid";
  const paidPct =
    loan.principal_amount > 0
      ? ((loan.principal_amount - loan.remaining_amount) /
          loan.principal_amount) *
        100
      : 100;

  const isOverdue =
    !isPaid &&
    loan.due_date &&
    dayjs(loan.due_date).isBefore(dayjs(), "day");

  const accentColor = isGiven ? AppPalette.teal : AppPalette.warning;
  const initials = loan.person_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeBtn, { backgroundColor: AppPalette.teal }]}
        onPress={isPaid ? onMarkActive : onMarkPaid}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={isPaid ? "restore" : "check"}
          size={20}
          color="#fff"
        />
        <Text style={styles.swipeBtnLabel}>
          {isPaid ? "Reopen" : "Paid"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeBtn, { backgroundColor: AppPalette.danger }]}
        onPress={onDelete}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="trash-can" size={20} color="#fff" />
        <Text style={styles.swipeBtnLabel}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: isPaid ? 0.65 : 1,
          },
        ]}
        onPress={onPress}
        onLongPress={onEdit}
        activeOpacity={0.85}
      >
        {/* Left accent bar */}
        <View
          style={[styles.cardAccent, { backgroundColor: accentColor }]}
        />

        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor:
                isGiven ? theme.primarySoft
                  : colorScheme === "dark" ? "#2d1f04" : "#fef3c7",
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: accentColor }]}>
            {initials}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text
              style={[styles.personName, { color: theme.text }]}
              numberOfLines={1}
            >
              {loan.person_name}
            </Text>
            <Text style={[styles.amount, { color: accentColor }]}>
              {formatMoney(loan.remaining_amount, currency)}
            </Text>
          </View>

          <View style={styles.cardMidRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isGiven ? theme.primarySoft : colorScheme === "dark" ? "#2d1f04" : "#fef3c7" },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: accentColor }]}>
                {isGiven ? "Lent" : "Borrowed"}
              </Text>
            </View>

            {isPaid ? (
              <View
                style={[styles.paidBadge, { backgroundColor: theme.primarySoft }]}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={11}
                  color={theme.primary}
                />
                <Text style={[styles.paidText, { color: theme.primary }]}>
                  Paid
                </Text>
              </View>
            ) : isOverdue ? (
              <View
                style={[
                  styles.paidBadge,
                  { backgroundColor: colorScheme === "dark" ? "#2d0a0a" : "#fee2e2" },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-alert"
                  size={11}
                  color={AppPalette.danger}
                />
                <Text
                  style={[styles.paidText, { color: AppPalette.danger }]}
                >
                  Overdue
                </Text>
              </View>
            ) : loan.due_date ? (
              <Text style={[styles.dueDate, { color: theme.textMuted }]}>
                Due {dayjs(loan.due_date).format("MMM D")}
              </Text>
            ) : null}
          </View>

          {/* Progress bar */}
          {!isPaid && (
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: accentColor,
                    width: `${Math.min(100, paidPct)}%`,
                  },
                ]}
              />
            </View>
          )}

          {loan.note ? (
            <Text
              style={[styles.note, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {loan.note}
            </Text>
          ) : null}
        </View>

        {!isPaid && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={theme.textMuted}
          />
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.padding,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: Layout.padding,
    gap: 12,
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    gap: 6,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  filterRow: {
    flexDirection: "row",
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    borderRadius: Layout.radius,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAction: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 4,
  },
  emptyActionLabel: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    overflow: "hidden",
    gap: 12,
    paddingRight: 12,
    paddingVertical: 12,
  },
  cardAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
  },
  cardMidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dueDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  note: {
    fontSize: 12,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: Layout.radiusSmall,
    overflow: "hidden",
    marginLeft: 8,
  },
  swipeBtn: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swipeBtnLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
