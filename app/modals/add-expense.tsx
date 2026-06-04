import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Alert, StyleSheet, View } from "react-native";

import { ExpenseForm } from "@/components/forms/expense-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { useBudgetStore } from "@/store/useBudgetStore";

export default function AddExpenseModal() {
  const db = useSQLiteContext();
  const { expenseId } = useLocalSearchParams<{ expenseId?: string }>();
  const activeBudgetPeriod = useBudgetStore(
    (state) => state.activeBudgetPeriod,
  );
  const categories = useBudgetStore((state) => state.categories);
  const expenses = useBudgetStore((state) => state.expenses);
  const currency = useBudgetStore((state) => state.currencyLabel());
  const addExpense = useBudgetStore((state) => state.addExpense);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const removeExpense = useBudgetStore((state) => state.removeExpense);

  const expense = expenseId
    ? (expenses.find((item) => item.id === expenseId) ?? null)
    : null;

  if (!activeBudgetPeriod) {
    return (
      <Screen>
        <EmptyState
          icon="wallet-plus"
          title="Create a budget first"
          description="You need an active budget period before logging expenses."
          actionLabel="Set up budget"
          onActionPress={() => router.replace("/modals/add-income?mode=budget")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <ExpenseForm
          categories={categories}
          budgetLabel={activeBudgetPeriod.label}
          currency={currency}
          initialValues={expense ?? undefined}
          submitLabel={expense ? "Update expense" : "Save expense"}
          onSubmit={async (values) => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (expense) {
              await updateExpense(db, {
                id: expense.id,
                budgetPeriodId: activeBudgetPeriod.id,
                amount: values.amount,
                categoryId: values.categoryId,
                subcategoryId: values.subcategoryId,
                note: values.note,
                date: values.date,
                time: values.time,
                paymentMethod: values.paymentMethod,
                receiptUri: values.receiptUri ?? null,
                isRecurring: values.isRecurring,
                recurrenceRule: values.recurrenceRule ?? null,
              });
            } else {
              await addExpense(db, {
                budgetPeriodId: activeBudgetPeriod.id,
                amount: values.amount,
                categoryId: values.categoryId,
                subcategoryId: values.subcategoryId,
                note: values.note,
                date: values.date,
                time: values.time,
                paymentMethod: values.paymentMethod,
                receiptUri: values.receiptUri ?? null,
                isRecurring: values.isRecurring,
                recurrenceRule: values.recurrenceRule ?? null,
              });
            }
            router.back();
          }}
          onDelete={
            expense
              ? async () => {
                  Alert.alert(
                    "Delete expense?",
                    "This removes the expense from the current budget period.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          await removeExpense(db, expense.id);
                          router.back();
                        },
                      },
                    ],
                  );
                }
              : undefined
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
