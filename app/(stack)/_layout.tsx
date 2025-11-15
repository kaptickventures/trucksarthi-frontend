// app/(stack)/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { useColorScheme, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StackLayout() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();

  // Same theme logic as Home
  const backgroundColor = isDark
    ? "hsl(220 15% 8%)"     // dark --background
    : "hsl(0 0% 100%)";     // light --background

  const foregroundColor = isDark
    ? "hsl(0 0% 98%)"       // dark --foreground
    : "hsl(0 0% 4%)";       // light --foreground

  return (
    <Stack
      screenOptions={{
        // 🌟 copied from home header
        headerTransparent: false,
        headerBlurEffect: "systemMaterial",
        headerShadowVisible: false,
        autoHideHomeIndicator: true,

        // 🌟 matching colors exactly like home
        headerStyle: {
          backgroundColor,
        },
        headerTintColor: foregroundColor,
        headerTitleAlign: "center",
        headerTitleStyle: {
          color: foregroundColor,
          fontWeight: "600",
        },

        // 🌟 Left: Back icon (but looks like Home's icons)
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 6,
              paddingVertical: 4,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={foregroundColor}
            />
          </TouchableOpacity>
        ),

        // 🌟 Right: Profile icon same as Home
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            style={{
              paddingHorizontal: 6,
              paddingVertical: 4,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={26}
              color={foregroundColor}
            />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Profile */}
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Trucksarthi",
        }}
      />

      {/* Managers */}
      <Stack.Screen name="clients-manager" options={{ title: "Clients" }} />
      <Stack.Screen name="trucks-manager" options={{ title: "Trucks" }} />
      <Stack.Screen name="drivers-manager" options={{ title: "Drivers" }} />
      <Stack.Screen name="locations-manager" options={{ title: "Locations" }} />
    </Stack>
  );
}
