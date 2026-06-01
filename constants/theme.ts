import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0f172a",
    background: "#f4efe7",
    tint: "#0f766e",
    icon: "#475569",
    tabIconDefault: "#64748b",
    tabIconSelected: "#0f766e",
  },
  dark: {
    text: "#f8fafc",
    background: "#09111c",
    tint: "#5eead4",
    icon: "#94a3b8",
    tabIconDefault: "#94a3b8",
    tabIconSelected: "#5eead4",
  },
};

export const AppPalette = {
  coral: "#f97316",
  teal: "#0f766e",
  mint: "#34d399",
  sky: "#38bdf8",
  gold: "#fbbf24",
  rose: "#fb7185",
  ink: "#0f172a",
  paper: "#f8fafc",
  card: "#fff8f0",
  muted: "#64748b",
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
};

export const AppTheme = {
  light: {
    background: Colors.light.background,
    surface: "#fffaf4",
    surfaceAlt: "#fff1e5",
    text: Colors.light.text,
    textMuted: "#475569",
    border: "#e7dccf",
    primary: AppPalette.teal,
    primarySoft: "#d7f5ef",
    secondary: AppPalette.coral,
    danger: AppPalette.danger,
    warning: AppPalette.warning,
    success: AppPalette.success,
    shadow: "rgba(15, 23, 42, 0.10)",
  },
  dark: {
    background: Colors.dark.background,
    surface: "#111c2b",
    surfaceAlt: "#142235",
    text: Colors.dark.text,
    textMuted: "#cbd5e1",
    border: "#223244",
    primary: AppPalette.mint,
    primarySoft: "#103228",
    secondary: AppPalette.gold,
    danger: "#fb7185",
    warning: "#fbbf24",
    success: "#34d399",
    shadow: "rgba(0, 0, 0, 0.35)",
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Layout = {
  radius: 24,
  radiusSmall: 16,
  radiusLarge: 32,
  padding: 16,
  gap: 12,
};
