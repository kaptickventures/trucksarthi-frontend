// App.tsx
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-reanimated'; // MUST be at top
import "../global.css";
import { ThemeStoreProvider, useThemeStore } from "../hooks/useThemeStore";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { NAV_THEME } from "../theme";

import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { NotificationProvider } from "../context/NotificationContext";
import { LocationPickerProvider } from "../context/LocationPickerContext";

function MainLayout() {
  const { theme } = useThemeStore();
  usePushNotifications();

  return (
    <ThemeProvider value={NAV_THEME[theme]}>
      <View style={{ flex: 1 }}>
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
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <LanguageProvider>
            <ThemeStoreProvider>
              <NotificationProvider>
                <LocationPickerProvider>
                  <BottomSheetModalProvider>
                    <MainLayout />
                  </BottomSheetModalProvider>
                </LocationPickerProvider>
              </NotificationProvider>
            </ThemeStoreProvider>
          </LanguageProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
