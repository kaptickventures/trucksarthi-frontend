import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";

export const THEME = {
  light: {
    background: "#FFFFFF",
    foreground: "#111B21",

    card: "#F7F7F7",
    cardForeground: "#111B21",

    popover: "#FFFFFF",
    popoverForeground: "#111B21",

    primary: "#25D366",           // WhatsApp green
    primaryForeground: "#FFFFFF",

    secondary: "#ECECEC",
    secondaryForeground: "#1A1A1A",

    muted: "#F0F0F0",
    mutedForeground: "#666666",

    accent: "#E6FFEE",           // light green tint
    accentForeground: "#128C7E",

    success: "#25D366",
    destructive: "#FF4B4B",

    border: "#D1D1D1",
    input: "#F0F0F0",
    ring: "#25D366",

    radius: "0.625rem",

    chart1: "#25D366",
    chart2: "#1DAA61",
    chart3: "#F4B400",
    chart4: "#34B7F1",
    chart5: "#FF6D6D",
  },

  dark: {
    background: "#111B21",
    foreground: "#EDEDED",

    card: "#1A2230",
    cardForeground: "#EDEDED",

    popover: "#1E2A33",
    popoverForeground: "#EDEDED",

    primary: "#1FA855",         // WhatsApp green dark
    primaryForeground: "#FFFFFF",

    secondary: "#202C33",
    secondaryForeground: "#EDEDED",

    muted: "#1F2A30",
    mutedForeground: "#BFBFBF",

    accent: "#1F3A37",          // dark teal accent
    accentForeground: "#FFFFFF",

    success: "#1FA855",
    destructive: "#FF5C5C",

    border: "#2A343C",
    input: "#202C33",
    ring: "#1FA855",

    radius: "0.625rem",

    chart1: "#1FA855",
    chart2: "#3DDC84",
    chart3: "#F4C430",
    chart4: "#7A5CFA",
    chart5: "#FF4F6D",
  },
};

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
