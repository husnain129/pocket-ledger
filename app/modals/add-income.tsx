import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StyleSheet, View } from "react-native";

import { BudgetForm } from "@/components/forms/budget-form";
import { IncomeForm } from "@/components/forms/income-form";
import { Screen } from "@/components/ui/screen";
import { useBudgetStore } from "@/store/useBudgetStore";

export default function AddIncomeModal() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ mode?: string }>();
  const activeBudgetPeriod = useBudgetStore(
    (state) => state.activeBudgetPeriod,
  );
  const createBudgetPeriod = useBudgetStore(
    (state) => state.createBudgetPeriod,
  );
  const addIncomeEntry = useBudgetStore((state) => state.addIncomeEntry);
  const currency = useBudgetStore((state) => state.currencyLabel());

  const showBudgetSetup = params.mode === "budget" || !activeBudgetPeriod;

  return (
    <Screen>
      <View style={styles.container}>
        {showBudgetSetup ? (
          <BudgetForm
            currencies={["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR", "CAD", "AUD", "JPY"]}
            initialValues={
              activeBudgetPeriod
                ? {
                    label: activeBudgetPeriod.label,
                    totalAmount: activeBudgetPeriod.total_amount,
                    startDate: activeBudgetPeriod.start_date,
                    endDate: activeBudgetPeriod.end_date,
                    currency: activeBudgetPeriod.currency,
                  }
                : undefined
            }
            submitLabel={
              activeBudgetPeriod
                ? "Update budget period"
                : "Create budget period"
            }
            onSubmit={async (values) => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const periodId = await createBudgetPeriod(db, values);
              if (values.currency) {
                await useBudgetStore
                  .getState()
                  .updateSetting(db, "currency", values.currency);
              }
              if (activeBudgetPeriod) {
                await useBudgetStore
                  .getState()
                  .updateSetting(db, "active_budget_period_id", periodId);
              }
              router.back();
            }}
          />
        ) : (
          <IncomeForm
            initialValues={{
              amount: 0,
              date: new Date().toISOString().slice(0, 10),
            }}
            currency={currency}
            submitLabel="Add funds"
            onSubmit={async (values) => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await addIncomeEntry(db, {
                budgetPeriodId: activeBudgetPeriod!.id,
                amount: values.amount,
                note: values.note,
                date: values.date,
              });
              router.back();
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
