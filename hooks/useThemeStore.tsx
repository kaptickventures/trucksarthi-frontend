import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
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
  const { setColorScheme: setNwColorScheme } = useNativeWindColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<ThemeType>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );

  const applyTheme = (targetMode: ThemeMode, systemScheme: ColorSchemeName) => {
    let next: ThemeType = "light";
    if (targetMode === "system") {
      next = systemScheme === "dark" ? "dark" : "light";
    } else {
      next = targetMode === "dark" ? "dark" : "light";
    }

    setTheme(next);
    setNwColorScheme(next);
    SystemUI.setBackgroundColorAsync(next === "dark" ? THEME.dark.background : THEME.light.background);
  };

  useEffect(() => {
    (async () => {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedMode) {
        const validatedMode = savedMode as ThemeMode;
        setMode(validatedMode);
        applyTheme(validatedMode, Appearance.getColorScheme());
      } else {
        // No saved preference, default to system
        setMode("system");
        applyTheme("system", Appearance.getColorScheme());
      }
    })();
  }, []);

  const updateMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem(STORAGE_KEY, newMode);
    applyTheme(newMode, Appearance.getColorScheme());
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === "system") applyTheme("system", colorScheme);
    });
    return () => subscription.remove();
  }, [mode]);

  const colors = THEME[theme];

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
