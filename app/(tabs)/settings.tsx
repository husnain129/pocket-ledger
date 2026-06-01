import { File, Paths } from "expo-file-system";
import * as LocalAuthentication from "expo-local-authentication";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import {
  Button,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";

import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { Tag } from "@/components/ui/tag";
import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const dbSettings = useBudgetStore((state) => state.settings);
  const updateSetting = useBudgetStore((state) => state.updateSetting);
  const resetAllData = useBudgetStore((state) => state.resetAllData);
  const exportSnapshot = useBudgetStore((state) => state.exportSnapshot);
  const restoreSnapshot = useBudgetStore((state) => state.restoreSnapshot);
  const setLocked = useBudgetStore((state) => state.setLocked);
  const [busy, setBusy] = useState(false);

  async function changeSetting(key: string, value: string) {
    await updateSetting(db, key, value);
  }

  async function toggleAppLock(nextValue: boolean) {
    if (nextValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biometrics unavailable",
          "Enroll Face ID, Touch ID, fingerprint, or a device passcode first.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable app lock for PocketLedger",
      });
      if (!result.success) {
        return;
      }

      await changeSetting("app_lock_enabled", "true");
      setLocked(true);
      return;
    }

    await changeSetting("app_lock_enabled", "false");
    setLocked(false);
  }

  async function exportJsonBackup() {
    setBusy(true);
    try {
      const snapshot = await exportSnapshot(db);
      const file = new File(
        Paths.cache,
        `pocketledger-backup-${Date.now()}.json`,
      );
      file.write(JSON.stringify(snapshot, null, 2));
      await import("expo-sharing").then(({ shareAsync }) =>
        shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Share PocketLedger backup",
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  async function importJsonBackup() {
    setBusy(true);
    try {
      const picked = await File.pickFileAsync(undefined, "application/json");
      const backupFile = Array.isArray(picked) ? picked[0] : picked;
      if (!backupFile) {
        return;
      }

      const parsed = JSON.parse(await backupFile.text());
      await restoreSnapshot(db, parsed);
    } catch (error) {
      Alert.alert(
        "Restore failed",
        error instanceof Error
          ? error.message
          : "Could not restore the selected backup.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resetData() {
    Alert.alert(
      "Reset all data?",
      "This removes budgets, expenses, income entries, and settings from the device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await resetAllData(db);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Tune the app for your currency, privacy, and notification preferences.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Theme
        </Text>
        <SegmentedButtons
          value={dbSettings.theme ?? "system"}
          onValueChange={(value) => changeSetting("theme", value)}
          buttons={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
        />
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>
              App lock
            </Text>
            <Text style={[styles.itemSubtitle, { color: theme.textMuted }]}>
              Require biometric auth every time the app becomes active.
            </Text>
          </View>
          <Switch
            value={dbSettings.app_lock_enabled === "true"}
            onValueChange={toggleAppLock}
          />
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Notifications
        </Text>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>
              Daily summary
            </Text>
            <Text style={[styles.itemSubtitle, { color: theme.textMuted }]}>
              Repeats every day at your chosen time.
            </Text>
          </View>
          <Switch
            value={dbSettings.daily_summary_enabled === "true"}
            onValueChange={(value) =>
              changeSetting("daily_summary_enabled", String(value))
            }
          />
        </View>
        <TextInput
          label="Daily time"
          value={dbSettings.daily_summary_time ?? "19:00"}
          onChangeText={(value) => changeSetting("daily_summary_time", value)}
          mode="outlined"
          dense
        />
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>
              Weekly digest
            </Text>
            <Text style={[styles.itemSubtitle, { color: theme.textMuted }]}>
              Get a recap before the week closes.
            </Text>
          </View>
          <Switch
            value={dbSettings.weekly_digest_enabled === "true"}
            onValueChange={(value) =>
              changeSetting("weekly_digest_enabled", String(value))
            }
          />
        </View>
        <TextInput
          label="Weekly time"
          value={dbSettings.weekly_digest_time ?? "19:00"}
          onChangeText={(value) => changeSetting("weekly_digest_time", value)}
          mode="outlined"
          dense
        />
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Weekly day
        </Text>
        <View style={styles.tagRow}>
          {[
            { label: "Sun", value: "1" },
            { label: "Mon", value: "2" },
            { label: "Tue", value: "3" },
            { label: "Wed", value: "4" },
            { label: "Thu", value: "5" },
            { label: "Fri", value: "6" },
            { label: "Sat", value: "7" },
          ].map((item) => (
            <Tag
              key={item.value}
              label={item.label}
              selected={(dbSettings.weekly_digest_day ?? "1") === item.value}
              onPress={() => changeSetting("weekly_digest_day", item.value)}
            />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Backup
        </Text>
        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={exportJsonBackup}
            loading={busy}
            disabled={busy}
            icon="backup-restore"
          >
            Export JSON
          </Button>
          <Button
            mode="outlined"
            onPress={importJsonBackup}
            loading={busy}
            disabled={busy}
            icon="file-import-outline"
          >
            Import JSON
          </Button>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Danger zone
        </Text>
        <Button
          mode="contained"
          buttonColor={theme.danger}
          onPress={resetData}
          loading={busy}
          disabled={busy}
        >
          Reset all data
        </Button>
      </View>

      {Platform.OS === "web" ? (
        <EmptyState
          icon="web"
          title="Web friendly"
          description="The same offline database and exports work on the web build too, with browser-specific sharing behavior."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: Layout.radius,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  itemSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
