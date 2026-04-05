import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, usePathname, useRouter } from "expo-router";
import {
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";

import { useAuth } from "../../context/AuthContext";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { NotificationBadge } from "../../components/NotificationBadge";

export default function StackLayout() {
  const { theme, colors } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const router = useRouter();
  const { user, loading, suspended } = useAuth();
  const pathname = usePathname();
  const allowUnauthed = pathname === "/desktop-qr";

  useEffect(() => {
    if (!loading && suspended) {
      router.replace("/account-suspended" as any);
      return;
    }
    if (!loading && !user && !allowUnauthed) {
      router.replace("/auth/login" as any);
    }
  }, [user, loading, suspended, router, allowUnauthed]);

  if ((loading || suspended) && !allowUnauthed) {
    return null;
  }

  if ((!user || suspended) && !allowUnauthed) {
    return null;
  }

  const backgroundColor = colors.background;
  const foregroundColor = colors.foreground;

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
            headerTitle: "Trucksarthi",
            headerTitleAlign: "center",
            headerTitleStyle: {
              color: foregroundColor,
              fontWeight: "800",
              fontSize: 22,
            },
            headerTintColor: foregroundColor,
            animation: "slide_from_right",
            contentStyle: { backgroundColor },
            headerStyle: { backgroundColor: "transparent" },
            headerBackground: () => (
              <View
                style={{
                  flex: 1,
                  backgroundColor: backgroundColor,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              />
            ),

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
                onPress={() => router.push("/(stack)/notifications" as any)}
                style={{ padding: 6 }}
              >
                <NotificationBadge size={24} color={foregroundColor} />
              </TouchableOpacity>
            ),
          }}
        >
          <Stack.Screen
            name="profile"
            options={{
              title: t('myProfile'),
              contentStyle: { backgroundColor },
            }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: "Settings" }}
          />
          <Stack.Screen
            name="plans-pricing"
            options={{ title: "Plans & Pricing" }}
          />
          <Stack.Screen name="clients-manager" options={{ title: "Clients" }} />
          <Stack.Screen name="trucks-manager" options={{ title: "Trucks" }} />
          <Stack.Screen name="drivers-manager" options={{ title: "Drivers" }} />
          <Stack.Screen
            name="locations-manager"
            options={{ title: "Locations" }}
          />
          <Stack.Screen name="client-profile" options={{ title: "Client Profile" }} />
          <Stack.Screen name="driver-profile" options={{ title: "Driver Profile" }} />
          <Stack.Screen name="trucks-profile" options={{ title: "Truck Profile" }} />
          <Stack.Screen name="helpCenter" options={{ title: "Help Center" }} />
          <Stack.Screen name="desktop-qr" options={{ headerShown: false }} />
          <Stack.Screen name="desktop-auth" options={{ title: t('useDesktop') }} />
          <Stack.Screen name="kyc-verification" options={{ title: t('kycVerifications') }} />
          <Stack.Screen name="update-pan" options={{ title: "Update PAN" }} />
          <Stack.Screen name="update-gstin" options={{ title: "Update GSTIN" }} />
          <Stack.Screen name="update-bank" options={{ title: "Update Bank" }} />

          <Stack.Screen name="gstin-onboarding" options={{ title: "Trucksarthi" }} />
          <Stack.Screen name="basic-details" options={{ title: "Trucksarthi" }} />
          <Stack.Screen name="truck-manager" options={{ title: "Truck Manager" }} />
          <Stack.Screen name="truck-manager-options" options={{ title: "Truck Manager" }} />
          <Stack.Screen name="document-details" options={{ title: "Document Details" }} />
          <Stack.Screen name="truck-khata" options={{ title: "Truck Khata" }} />
          <Stack.Screen name="truck-khata-modules" options={{ title: "Truck Khata" }} />
          <Stack.Screen name="finance" options={{ title: "Finance Hub" }} />
          <Stack.Screen name="pl-reports" options={{ title: "P&L Reports" }} />
          <Stack.Screen name="pl-client-report" options={{ title: "Client Khata Report" }} />
          <Stack.Screen name="pl-driver-report" options={{ title: "Driver Khata Report" }} />
          <Stack.Screen name="pl-truck-report" options={{ title: "Truck Report" }} />
          <Stack.Screen name="pl-client-report-detail" options={{ title: "Client Khata Detail" }} />
          <Stack.Screen name="pl-driver-report-detail" options={{ title: "Driver PL Detail" }} />
          <Stack.Screen name="pl-truck-report-detail" options={{ title: "Truck PL Detail" }} />
          <Stack.Screen name="pl-report-detail" options={{ title: "PL Detail" }} />
          <Stack.Screen name="pl-misc-report" options={{ title: "Misc PL" }} />
          <Stack.Screen name="pl-misc-report-detail" options={{ title: "Misc Report Detail" }} />
          <Stack.Screen
            name="notifications"
            options={{
              title: "Notifications",
              headerRight: () => null,
            }}
          />
          <Stack.Screen name="transactions" options={{ title: "Transactions" }} />
          <Stack.Screen name="create-invoice" options={{ title: "Create Invoice" }} />
          <Stack.Screen name="expense-manager" options={{ title: "Expense Manager" }} />
          <Stack.Screen name="daily-khata" options={{ title: "Daily Khata" }} />
          <Stack.Screen name="daily-khata-dashboard" options={{ title: "Truck Running" }} />
          <Stack.Screen name="maintenance-khata" options={{ title: "Maintenance Khata" }} />
          <Stack.Screen name="maintenance-dashboard" options={{ title: "Truck Maintenance" }} />
          <Stack.Screen name="trip-detail" options={{ title: "Trip Detail" }} />
          <Stack.Screen name="edit-trip" options={{ title: "Edit Trip" }} />
          <Stack.Screen name="bilty-wizard" options={{ title: "Bilty Wizard" }} />
          <Stack.Screen name="bilty-generated" options={{ title: "Bilty Saved" }} />
          <Stack.Screen name="driver-ledger" options={{ title: "Driver Khata" }} />
          <Stack.Screen name="driver-ledger-detail" options={{ title: "Driver Khata" }} />
          <Stack.Screen name="client-ledger" options={{ title: "Client Khata" }} />
          <Stack.Screen name="client-ledger-detail" options={{ title: "Client Khata" }} />
          <Stack.Screen name="client-payments" options={{ title: "Client Payments" }} />
          <Stack.Screen name="misc-transactions" options={{ title: "Misc Transactions" }} />
          <Stack.Screen name="location-picker" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
}
