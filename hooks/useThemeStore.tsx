import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useMemo } from "react";
import { Appearance, ColorSchemeName, useColorScheme } from "react-native";
import { THEME } from "../theme";

type ThemeMode = "system" | "light" | "dark";
type ThemeType = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeType;
  colors: typeof THEME.light;
  setMode: (mode: ThemeMode) => void;
}

const ThemeStoreContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = "@user_theme_mode";

export function ThemeStoreProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { setColorScheme: setNwColorScheme } = useNativeWindColorScheme();

  const [mode, setMode] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<ThemeType>("light");

  // Load saved preference
  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode) {
          setMode(savedMode as ThemeMode);
        }
      } catch (e) {
        console.error("Failed to load theme mode", e);
      }
    })();
  }, []);

  // Update effective theme when mode or system settings change
  useEffect(() => {
    let next: ThemeType = "light";
    if (mode === "system") {
      next = systemScheme === "dark" ? "dark" : "light";
    } else {
      next = mode === "dark" ? "dark" : "light";
    }

    setTheme(next);
    setNwColorScheme(next);

    // Set root background color to avoid white flashes
    const bgColor = next === "dark" ? THEME.dark.background : THEME.light.background;
    SystemUI.setBackgroundColorAsync(bgColor).catch(() => { });
  }, [mode, systemScheme, setNwColorScheme]);

  const updateMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {
      console.error("Failed to save theme mode", e);
    }
  };

  const colors = useMemo(() => THEME[theme], [theme]);

  return (
    <ThemeStoreContext.Provider value={{ mode, theme, colors, setMode: updateMode }}>
      {children}
    </ThemeStoreContext.Provider>
  );
}

export function useThemeStore() {
  const ctx = useContext(ThemeStoreContext);
  if (!ctx) throw new Error("useThemeStore must be inside ThemeStoreProvider");
  return ctx;
}
