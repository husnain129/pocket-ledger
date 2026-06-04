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
    background: "#f2f2f7",
    surface: "#ffffff",
    surfaceAlt: "#f8f8fb",
    text: "#1c1c2e",
    textMuted: "#8e8e93",
    border: "rgba(0,0,0,0.06)",
    primary: "#1c1c2e",
    primarySoft: "#f0f0f5",
    secondary: "#e53935",
    danger: "#e53935",
    warning: "#ff9500",
    success: "#34c759",
    shadow: "rgba(0,0,0,0.08)",
  },
  dark: {
    background: "#0a0a12",
    surface: "#16162a",
    surfaceAlt: "#1e1e35",
    text: "#f4f4ff",
    textMuted: "#7878a0",
    border: "rgba(255,255,255,0.08)",
    primary: "#e53935",
    primarySoft: "#2d0a0a",
    secondary: "#e53935",
    danger: "#ff453a",
    warning: "#ff9f0a",
    success: "#30d158",
    shadow: "rgba(0,0,0,0.5)",
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
