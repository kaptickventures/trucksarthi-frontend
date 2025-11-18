import { Stack, useRouter } from "expo-router";
import {
  useColorScheme,
  TouchableOpacity,
  Platform,
  StatusBar,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function StackLayout() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const isAndroid = Platform.OS === "android";

  // Theme palette
  const backgroundColor = isDark ? "#0D1117" : "#FFFFFF"; // matching surface colors
  const foregroundColor = isDark ? "#E6EDF3" : "#050505";

  return (
    <BottomSheetModalProvider>
      {/* 🔹 StatusBar Setup */}
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

            // iOS blur
            ...(Platform.OS === "ios" && {
              headerBlurEffect: "systemMaterial",
            }),

            // Back button
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

            // Right icon
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
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
          {/* Internal screens wrapped in their own SafeAreaView */}
          <Stack.Screen
            name="profile"
            options={{
              title: "Profile",
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
        </Stack>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
}
