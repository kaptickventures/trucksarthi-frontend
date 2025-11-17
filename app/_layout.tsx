// App.tsx
import React from "react";
import 'react-native-reanimated'; // MUST be at top
import { StatusBar } from "react-native";
import { ThemeProvider } from "@react-navigation/native";
import { Slot } from "expo-router";
import { useColorScheme } from "../hooks/use-color-scheme.web";
import { NAV_THEME } from "../theme";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider
          value={NAV_THEME[colorScheme === "dark" ? "dark" : "light"]}
        >
          <StatusBar
            barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          />
          <Slot />
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
