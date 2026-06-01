# PocketLedger

PocketLedger is an offline-first React Native expense tracker built with Expo Router, SQLite, and Zustand. It is designed for daily use on a phone without depending on a backend or network connection.

## What it does

- Tracks daily expenses against an active budget period
- Stores all data locally in SQLite
- Supports budget setup, income top-ups, expense logging, editing, and deletion
- Shows dashboard, history, analytics, and settings views
- Schedules local reminder notifications for daily and weekly check-ins
- Protects the app with biometric lock on supported devices
- Exports and restores JSON backups on device

## Tech Stack

- Expo SDK 54
- Expo Router for file-based navigation
- expo-sqlite for the local database
- Zustand for app state and hydration
- react-native-paper for UI controls and forms
- Gifted Charts for analytics charts
- expo-local-authentication for biometric lock
- expo-notifications for reminders

## Project Structure

- `app/` - routed screens and modal flows
- `components/` - reusable UI, forms, charts, and bootstrap helpers
- `db/` - SQLite schema, queries, and snapshot helpers
- `store/` - global state and CRUD actions
- `lib/` - notification helpers
- `hooks/` - theme and color-scheme helpers

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npx expo start
   ```

3. Open the app in an iOS simulator, Android emulator, development build, or Expo Go.

## Common Scripts

- `npm run reset-project` - restore the starter layout if you want a clean reset
- `npx expo start` - launch the app

## Data Model

PocketLedger stores its data locally in SQLite. The main tables are:

- budget periods
- income entries
- categories and subcategories
- expenses
- key/value settings

The store hydrates from SQLite on startup, keeps the active budget period in sync, and exposes the CRUD actions used by the screens and modal routes.

## Notes

- The app is intentionally offline-first. There is no remote API.
- Reminder notifications are local only and are synchronized from the settings screen.
- Backup exports are JSON files that can be shared or restored on the same device.
