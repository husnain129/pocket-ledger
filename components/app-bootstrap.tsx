import { useSQLiteContext } from "expo-sqlite";
import { useEffect } from "react";

import { evaluateBudgetAlerts } from "@/lib/notifications";
import { useBudgetStore } from "@/store/useBudgetStore";

export function AppBootstrap() {
  const db = useSQLiteContext();
  const hydrate = useBudgetStore((state) => state.hydrate);
  const activeBudgetPeriod = useBudgetStore(
    (state) => state.activeBudgetPeriod,
  );
  const settings = useBudgetStore((state) => state.settings);
  const isReady = useBudgetStore((state) => state.isReady);

  useEffect(() => {
    hydrate(db).catch((error) => {
      console.warn("Failed to hydrate PocketLedger", error);
    });
  }, [db, hydrate]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (activeBudgetPeriod) {
      evaluateBudgetAlerts(db, activeBudgetPeriod, settings).catch((error) => {
        console.warn("Failed to evaluate budget alerts", error);
      });
    }
  }, [activeBudgetPeriod, db, isReady, settings]);

  return null;
}
