import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";

/**
 * ⚠️ ALL COLORS BELOW ARE NOW VALID HEX
 *  - No HSL
 *  - No undefined values
 *  - NO Android crashes possible
 */

export const THEME = {
  light: {
    background: "#ffffff",
    foreground: "#0a0a0a",
    card: "#fafafa",
    cardForeground: "#0f0f0f",
    popover: "#ffffff",
    popoverForeground: "#0a0a0a",
    primary: "#1d4ed8",
    primaryForeground: "#ffffff",
    secondary: "#f2f2f2",
    secondaryForeground: "#262626",
    muted: "#f5f5f5",
    mutedForeground: "#666666",
    accent: "#eef4ff",
    accentForeground: "#1e3a8a",
    success: "#15803d",
    destructive: "#ef4444",
    border: "#e0e0e0",
    input: "#e0e0e0",
    ring: "#3b82f6",
    radius: "0.625rem",
    chart1: "#eb6a50",
    chart2: "#179f7b",
    chart3: "#2c4652",
    chart4: "#e4b468",
    chart5: "#ec9c58",
  },

  dark: {
    background: "#0f172a",
    foreground: "#fdfdfd",
    card: "#1e293b",
    cardForeground: "#fdfdfd",
    popover: "#232f41",
    popoverForeground: "#fdfdfd",
    primary: "#60a5fa",
    primaryForeground: "#ffffff",
    secondary: "#2f3c4e",
    secondaryForeground: "#f2f2f2",
    muted: "#2a3644",
    mutedForeground: "#bfbfbf",
    accent: "#2e3a48",
    accentForeground: "#fafafa",
    success: "#16a34a",
    destructive: "#e64949",
    border: "#3a4756",
    input: "#3a4756",
    ring: "#60a5fa",
    radius: "0.625rem",
    chart1: "#60a5fa",
    chart2: "#22c55e",
    chart3: "#facc15",
    chart4: "#c084fc",
    chart5: "#f43f5e",
  },
};

/**
 * 🚨 React Navigation expects ONLY these keys:
 *  { background, border, card, notification, primary, text }
 *  ✔ We supply ALL in valid hex form
 */

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },

  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
