import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import * as SystemUI from "expo-system-ui";

type ThemeMode = "system" | "light" | "dark";
type Theme = "light" | "dark";

const ThemeStoreContext = createContext<{
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
} | null>(null);

export function ThemeStoreProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<Theme>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );

  // Automatically handle system theme
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === "system") {
        const next = colorScheme === "dark" ? "dark" : "light";
        setTheme(next);
        SystemUI.setBackgroundColorAsync(next === "dark" ? "#000" : "#fff");
      }
    });

    return () => subscription.remove();
  }, [mode]);

  // When user picks light or dark manually
  useEffect(() => {
    if (mode !== "system") {
      const next = mode === "dark" ? "dark" : "light";
      setTheme(next);
      SystemUI.setBackgroundColorAsync(next === "dark" ? "#000" : "#fff");
    }
  }, [mode]);

  return (
    <ThemeStoreContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeStoreContext.Provider>
  );
}

export function useThemeStore() {
  const ctx = useContext(ThemeStoreContext);
  if (!ctx) throw new Error("useThemeStore must be inside ThemeStoreProvider");
  return ctx;
}
