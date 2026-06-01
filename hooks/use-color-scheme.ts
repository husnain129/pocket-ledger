import { useColorScheme as useSystemColorScheme } from "react-native";

import { useBudgetStore } from "@/store/useBudgetStore";

export function useColorScheme() {
  const systemColorScheme = useSystemColorScheme();
  const themeSetting = useBudgetStore((state) => state.settings.theme);

  if (themeSetting === "light" || themeSetting === "dark") {
    return themeSetting;
  }

  return systemColorScheme;
}
