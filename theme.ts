import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";

/**
 * WhatsApp-inspired design system for Truck Sarthi
 * Clean + scalable + semantic
 */

const base = {
  radius: 10,
};

const PALETTES = {
  light: {
    ...base,

    colors: {
      // Core
      bg: "#FFFFFF",
      text: "#111B21",

      // Surfaces
      surface: "#F7F7F7",
      surfaceAlt: "#ECECEC",

      // Brand (WhatsApp style)
      primary: "#25D366",
      primaryText: "#FFFFFF",

      // Secondary UI
      secondary: "#ECECEC",
      secondaryText: "#1A1A1A",

      // Accents
      accent: "#E6FFEE",
      accentText: "#128C7E",

      // States
      success: "#25D366",
      warning: "#F4B400",
      error: "#FF4B4B",
      info: "#1D4ED8",

      // Soft backgrounds (for badges, alerts)
      successBg: "#E6FFEE",
      warningBg: "#FEF3C7",
      errorBg: "#FEE2E2",
      infoBg: "#DBEAFE",

      // UI Elements
      border: "#DDE3EA",
      input: "#F8FAFC",
      ring: "#25D366",
      transparent: "transparent",
      shadow: "#000000",
      shadowSoft: "#00000033",
      overlay10: "rgba(0,0,0,0.10)",
      overlay35: "rgba(0,0,0,0.35)",
      overlay45: "rgba(0,0,0,0.45)",
      overlay60: "rgba(0,0,0,0.60)",
      overlay70: "rgba(0,0,0,0.70)",
      overlayOnDark20: "rgba(255,255,255,0.20)",
      overlayOnDark70: "rgba(255,255,255,0.70)",
      overlayOnDark92: "rgba(255,255,255,0.92)",

      // Muted
      muted: "#F0F0F0",
      mutedText: "#666666",

      // Charts
      chart: ["#25D366", "#1DAA61", "#F4B400", "#34B7F1", "#FF6D6D"],
    },
  },

  dark: {
    ...base,

    colors: {
      // Core
      bg: "#111B21",
      text: "#EDEDED",

      // Surfaces
      surface: "#182229",
      surfaceAlt: "#202C33",

      // Brand
      primary: "#1FA855",
      primaryText: "#FFFFFF",

      // Secondary
      secondary: "#202C33",
      secondaryText: "#EDEDED",

      // Accents
      accent: "#1F3A37",
      accentText: "#FFFFFF",

      // States
      success: "#1FA855",
      warning: "#F4C430",
      error: "#FF5C5C",
      info: "#3B82F6",

      // Soft backgrounds
      successBg: "#0A3325",
      warningBg: "#3A2A05",
      errorBg: "#450A0A",
      infoBg: "#111B3C",

      // UI Elements
      border: "#2E3C46",
      input: "#24323B",
      ring: "#1FA855",
      transparent: "transparent",
      shadow: "#000000",
      shadowSoft: "#00000033",
      overlay10: "rgba(0,0,0,0.10)",
      overlay35: "rgba(0,0,0,0.35)",
      overlay45: "rgba(0,0,0,0.45)",
      overlay60: "rgba(0,0,0,0.60)",
      overlay70: "rgba(0,0,0,0.70)",
      overlayOnDark20: "rgba(255,255,255,0.20)",
      overlayOnDark70: "rgba(255,255,255,0.70)",
      overlayOnDark92: "rgba(255,255,255,0.92)",

      // Muted
      muted: "#1F2A30",
      mutedText: "#BFBFBF",

      // Charts
      chart: ["#1FA855", "#3DDC84", "#F4C430", "#7A5CFA", "#FF4F6D"],
    },
  },
};

const toLegacyColors = (palette: typeof PALETTES.light) => {
  const c = palette.colors;
  return {
    // New palette tokens
    ...c,

    // Legacy/compat tokens used in existing screens
    background: c.bg,
    foreground: c.text,
    card: c.surface,
    cardForeground: c.text,
    popover: c.surface,
    popoverForeground: c.text,
    primaryForeground: c.primaryText,
    secondaryForeground: c.secondaryText,
    accentForeground: c.accentText,
    destructive: c.error,
    destructiveSoft: c.errorBg,
    successSoft: c.successBg,
    warningSoft: c.warningBg,
    infoSoft: c.infoBg,
    mutedForeground: c.mutedText,
    radius: `${palette.radius}px`,
    chart1: c.chart[0],
    chart2: c.chart[1],
    chart3: c.chart[2],
    chart4: c.chart[3],
    chart5: c.chart[4],
  };
};

export const THEME = {
  light: toLegacyColors(PALETTES.light),
  dark: toLegacyColors(PALETTES.dark),
};

/**
 * React Navigation theme mapping
 */
export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      card: THEME.light.card,
      text: THEME.light.foreground,
      border: THEME.light.border,
      primary: THEME.light.primary,
      notification: THEME.light.destructive,
    },
  },

  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      card: THEME.dark.card,
      text: THEME.dark.foreground,
      border: THEME.dark.border,
      primary: THEME.dark.primary,
      notification: THEME.dark.destructive,
    },
  },
};