import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, TextInput } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import "react-native-reanimated";

// Prevent Android system font scale from inflating app text sizes
if (!Text.defaultProps) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
if (!TextInput.defaultProps) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

import { AppBootstrap } from "@/components/app-bootstrap";
import { AppLockGate } from "@/components/app-lock-gate";
import { AppTheme } from "@/constants/theme";
import { DATABASE_NAME, initializeDatabase } from "@/db/schema";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = AppTheme[colorScheme ?? "light"];
  const paperTheme = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;

  const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <PaperProvider
          theme={{
            ...paperTheme,
            colors: {
              ...paperTheme.colors,
              primary: theme.primary,
              secondary: theme.secondary,
              background: theme.background,
              surface: theme.surface,
              onSurface: theme.text,
              onBackground: theme.text,
            },
          }}
        >
          <SQLiteProvider
            databaseName={DATABASE_NAME}
            onInit={initializeDatabase}
          >
            <AppBootstrap />
            <AppLockGate>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modals"
                  options={{ presentation: "modal", headerShown: false }}
                />
              </Stack>
            </AppLockGate>
          </SQLiteProvider>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </PaperProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
