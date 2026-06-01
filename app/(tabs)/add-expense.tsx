import { router } from "expo-router";
import { useEffect } from "react";

export default function AddExpenseTab() {
  useEffect(() => {
    router.replace("/modals/add-expense");
  }, []);

  return null;
}
