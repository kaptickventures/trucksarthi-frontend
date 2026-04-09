// App.tsx
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-reanimated'; // MUST be at top
import "../global.css";
import { ThemeStoreProvider, useThemeStore } from "../hooks/useThemeStore";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { setNetworkOnlineState } from "../lib/networkState";
import { cleanupExpiredGeneratedPdfs } from "../lib/pdfStorage";
import { NAV_THEME } from "../theme";

import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { NotificationProvider } from "../context/NotificationContext";
import { LocationPickerProvider } from "../context/LocationPickerContext";

function MainLayout() {
  const { theme } = useThemeStore();
  const [isOnline, setIsOnline] = useState(true);
  usePushNotifications();

  useEffect(() => {
    void cleanupExpiredGeneratedPdfs();
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkConnectivity = async () => {
      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL?.trim() || "https://cloudapi.trucksarthi.in";
      const healthUrl = `${baseUrl.replace(/\/$/, "")}/api/health`;

      try {
        const response = await fetch(healthUrl, { method: "GET" });
        const online = response.ok;
        if (mounted) {
          setIsOnline(online);
          setNetworkOnlineState(online);
        }
      } catch {
        if (mounted) {
          setIsOnline(false);
          setNetworkOnlineState(false);
        }
      }
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 6000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <ThemeProvider value={NAV_THEME[theme]}>
      <View style={{ flex: 1 }}>
        {!isOnline ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: "#B00020",
              paddingVertical: 10,
              paddingHorizontal: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
              OFFLINE - NO INTERNET CONNECTION FOUND
            </Text>
          </View>
        ) : null}
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <View style={{ flex: 1, paddingTop: !isOnline ? 38 : 0 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
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
