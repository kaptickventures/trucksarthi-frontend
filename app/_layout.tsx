// App.tsx
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated'; // MUST be at top
import "../global.css";
import { ThemeStoreProvider, useThemeStore } from "../hooks/useThemeStore";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { NAV_THEME } from "../theme";

import { View } from "react-native";

function MainLayout() {
  const { theme } = useThemeStore();
  usePushNotifications();

  return (
    <ThemeProvider value={NAV_THEME[theme]}>
      <View style={{ flex: 1 }} className={theme === "dark" ? "dark" : ""}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
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
