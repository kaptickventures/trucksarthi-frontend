// app/(stack)/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { useColorScheme, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";


export default function StackLayout() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark
            ? "hsl(var(--background))"
            : "hsl(var(--background))",
        },
        headerTintColor: isDark ? "#E5E7EB" : "#111827",
        headerTitleAlign: "center",
        headerShadowVisible: false,
        // ✅ Default back icon for all screens
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingHorizontal: 4, paddingVertical: 4 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? "#E5E7EB" : "#111827"}
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

      {/* Managers */}
      <Stack.Screen name="clients-manager" options={{ title: "Clients" }} />
      <Stack.Screen name="trucks-manager" options={{ title: "Trucks" }} />
      <Stack.Screen name="drivers-manager" options={{ title: "Drivers" }} />
      <Stack.Screen name="locations-manager" options={{ title: "Locations" }} />
    </Stack>
  );
}
