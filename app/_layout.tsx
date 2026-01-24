// App.tsx
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { Slot } from "expo-router";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated'; // MUST be at top
import "../global.css";
import { ThemeStoreProvider, useThemeStore } from "../hooks/useThemeStore";
import { NAV_THEME } from "../theme";

function MainLayout() {
  const { theme } = useThemeStore();

  return (
    <ThemeProvider value={NAV_THEME[theme]}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />
      <Slot />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeStoreProvider>
        <BottomSheetModalProvider>
          <MainLayout />
        </BottomSheetModalProvider>
      </ThemeStoreProvider>
    </GestureHandlerRootView>
  );
}
