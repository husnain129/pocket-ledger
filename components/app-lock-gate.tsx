import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { AppState, AppStateStatus, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";

type Props = {
  children: React.ReactNode;
};

async function authenticate() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !isEnrolled) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock PocketLedger",
    promptSubtitle: "Confirm it is you to access your finances",
    cancelLabel: "Use later",
    fallbackLabel: "Use passcode",
    disableDeviceFallback: false,
  });

  return result.success;
}

export function AppLockGate({ children }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const isLocked = useBudgetStore((state) => state.isLocked);
  const setLocked = useBudgetStore((state) => state.setLocked);
  const settings = useBudgetStore((state) => state.settings);
  const isReady = useBudgetStore((state) => state.isReady);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    if (!isReady || settings.app_lock_enabled !== "true") {
      return;
    }

    let isMounted = true;
    setAuthenticating(true);
    authenticate()
      .then((success) => {
        if (isMounted) {
          setLocked(!success);
        }
      })
      .finally(() => {
        if (isMounted) {
          setAuthenticating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isReady, setLocked, settings.app_lock_enabled]);

  useEffect(() => {
    if (settings.app_lock_enabled !== "true") {
      return;
    }

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState !== "active") {
          setLocked(true);
        }
      },
    );

    return () => subscription.remove();
  }, [setLocked, settings.app_lock_enabled]);

  if (!isReady) {
    return <>{children}</>;
  }

  if (settings.app_lock_enabled !== "true" || !isLocked) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          PocketLedger is locked
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Use Face ID, Touch ID, or your device passcode to continue.
        </Text>
        <Button
          mode="contained"
          loading={authenticating}
          disabled={authenticating}
          onPress={async () => {
            setAuthenticating(true);
            try {
              const success = await authenticate();
              setLocked(!success);
            } finally {
              setAuthenticating(false);
            }
          }}
        >
          Unlock
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Layout.padding,
  },
  card: {
    width: "100%",
    borderRadius: Layout.radius,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
