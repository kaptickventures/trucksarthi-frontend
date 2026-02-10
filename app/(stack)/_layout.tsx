import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, usePathname, useRouter } from "expo-router";
import {
  Platform,
  StatusBar,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";

import { THEME } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { getUserRole } from "../../hooks/useAuth";

export default function StackLayout() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    const userRole = getUserRole(user);
    if (
      !loading &&
      user &&
      userRole === "driver" &&
      !pathname.startsWith("/(driver)/(tabs)")
    ) {
      router.replace("/(driver)/(tabs)/home" as any);
    }
  }, [user, loading, pathname, router]);

  const userRole = getUserRole(user);
  if (loading || !user || userRole === "driver") {
    return null;
  }

  // Use proper theme colors
  const backgroundColor = isDark
    ? THEME.dark.background
    : THEME.light.background;

  const foregroundColor = isDark
    ? THEME.dark.foreground
    : THEME.light.foreground;

  return (
    <BottomSheetModalProvider>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTitleAlign: "center",
            headerTintColor: foregroundColor,
            animation: "slide_from_right",
            contentStyle: { backgroundColor },
            headerStyle: { backgroundColor },

            ...(Platform.OS === "ios" && {
              headerBlurEffect: "systemMaterial",
            }),

            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={foregroundColor}
                />
              </TouchableOpacity>
            ),

            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push("/notifications" as any)}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={foregroundColor}
                />
              </TouchableOpacity>
            ),
          }}
        >
          <Stack.Screen
            name="profile"
            options={{
              title: "Profile",
              headerShown: false,
              contentStyle: { backgroundColor },
            }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: "Trucksarthi" }}
          />
          <Stack.Screen name="clients-manager" options={{ title: "Clients" }} />
          <Stack.Screen name="trucks-manager" options={{ title: "Trucks" }} />
          <Stack.Screen name="drivers-manager" options={{ title: "Drivers" }} />
          <Stack.Screen
            name="locations-manager"
            options={{ title: "Locations" }}
          />
          <Stack.Screen name="client-profile" options={{ title: "Client Profile", headerShown: false }} />
          <Stack.Screen name="driver-profile" options={{ title: "Driver Profile", headerShown: false }} />
          <Stack.Screen name="trucks-profile" options={{ title: "Truck Profile", headerShown: false }} />
          <Stack.Screen name="helpCenter" options={{ title: "Help Center" }} />
          <Stack.Screen name="kyc-verification" options={{ title: "KYC Verification", headerShown: false }} />

          <Stack.Screen name="basic-details" options={{ title: "Trucksarthi" }} />
          <Stack.Screen name="documents-manager" options={{ title: "Documents" }} />
          <Stack.Screen name="document-details" options={{ title: "Document Details", headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
}
