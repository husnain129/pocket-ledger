import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { setSetting, type SettingMap } from "@/db/queries";
import type { BudgetPeriodView } from "@/db/types";

type SqliteDb = Parameters<typeof setSetting>[0];

const ALERT_CHANNEL_ID = "budget-alerts";

// expo-notifications remote push was removed from Expo Go on Android SDK 53+.
// Local notifications still work in development builds on both platforms.
const isSupported =
  Platform.OS !== "android" || Constants.appOwnership !== "expo";

if (isSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureChannel() {
  await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
    name: "PocketLedger alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0f766e",
    sound: null,
  });
}

async function scheduleReminderNotification(
  title: string,
  body: string,
  hour: number,
  minute: number,
) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { screen: "settings" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ALERT_CHANNEL_ID,
    },
  });
}

export async function syncReminderNotifications(
  db: SqliteDb,
  settings: SettingMap,
) {
  if (!isSupported) return;

  const permissionGranted = await ensurePermission();
  if (!permissionGranted) {
    return;
  }

  await ensureChannel();

  const dailyEnabled = settings.daily_summary_enabled === "true";
  const dailySummaryId = settings.daily_summary_notification_id;
  const dailyTime = settings.daily_summary_time ?? "19:00";
  const [dailyHour, dailyMinute] = dailyTime
    .split(":")
    .map((segment) => Number.parseInt(segment, 10));

  if (dailyEnabled) {
    if (dailySummaryId) {
      await Notifications.cancelScheduledNotificationAsync(dailySummaryId);
    }

    const nextDailyId = await scheduleReminderNotification(
      "Daily spending summary",
      "Open PocketLedger to review today's balance and spending.",
      Number.isNaN(dailyHour) ? 19 : dailyHour,
      Number.isNaN(dailyMinute) ? 0 : dailyMinute,
    );
    await setSetting(db, "daily_summary_notification_id", nextDailyId);
  } else if (dailySummaryId) {
    await Notifications.cancelScheduledNotificationAsync(dailySummaryId);
    await setSetting(db, "daily_summary_notification_id", "");
  }

  const weeklyEnabled = settings.weekly_digest_enabled === "true";
  const weeklyDigestId = settings.weekly_digest_notification_id;
  const weeklyTime = settings.weekly_digest_time ?? "19:00";
  const weeklyDay = Number.parseInt(settings.weekly_digest_day ?? "1", 10);
  const [weeklyHour, weeklyMinute] = weeklyTime
    .split(":")
    .map((segment) => Number.parseInt(segment, 10));

  if (weeklyEnabled) {
    if (weeklyDigestId) {
      await Notifications.cancelScheduledNotificationAsync(weeklyDigestId);
    }

    const nextWeeklyId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekly spending digest",
        body: "Review your week in PocketLedger before the next period starts.",
        data: { screen: "analytics" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: Number.isNaN(weeklyDay) ? 1 : weeklyDay,
        hour: Number.isNaN(weeklyHour) ? 19 : weeklyHour,
        minute: Number.isNaN(weeklyMinute) ? 0 : weeklyMinute,
        channelId: ALERT_CHANNEL_ID,
      },
    });
    await setSetting(db, "weekly_digest_notification_id", nextWeeklyId);
  } else if (weeklyDigestId) {
    await Notifications.cancelScheduledNotificationAsync(weeklyDigestId);
    await setSetting(db, "weekly_digest_notification_id", "");
  }
}

export async function evaluateBudgetAlerts(
  db: SqliteDb,
  budgetPeriod: BudgetPeriodView,
  settings: SettingMap,
) {
  if (!isSupported) return;

  const permissionGranted = await ensurePermission();
  if (!permissionGranted) {
    return;
  }

  const totalBudget =
    budgetPeriod.total_amount + budgetPeriod.additional_income;
  if (totalBudget <= 0) {
    return;
  }

  const spent = budgetPeriod.total_expenses;
  const usedPercent = (spent / totalBudget) * 100;
  const thresholdKeyBase = `budget_alert_${budgetPeriod.id}`;

  if (usedPercent >= 90 && settings[`${thresholdKeyBase}_90`] !== "true") {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Budget alert: 90% used",
        body: `You have used 90% of your current budget.`,
        data: { screen: "home" },
      },
      trigger: null,
    });
    await setSetting(db, `${thresholdKeyBase}_90`, "true");
  }

  if (usedPercent >= 75 && settings[`${thresholdKeyBase}_75`] !== "true") {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Budget warning: 75% used",
        body: `You have used 75% of your current budget.`,
        data: { screen: "home" },
      },
      trigger: null,
    });
    await setSetting(db, `${thresholdKeyBase}_75`, "true");
  }
}
