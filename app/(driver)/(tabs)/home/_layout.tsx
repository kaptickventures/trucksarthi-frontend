import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../../../hooks/useThemeStore";
import { useDriverAppContext } from "../../../../context/DriverAppContext";
import { translations } from "../../../../constants/driver/translations";
import React from "react";

export default function HomeLayout() {
    const { colors } = useThemeStore();
    const { language } = useDriverAppContext();
    const t = translations[language];
    const router = useRouter();

    // Note: menuVisible state is managed in the root layout's context via SideMenu.
    // We trigger it here by pushing/setting an event or just using a shared state if available.
    // For now, we'll use a hack or just pass the event up if possible.
    // Actually, we can use the same pattern as the main app's home screen.

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: {
                    color: colors.foreground,
                    fontWeight: "800",
                    fontSize: 22,
                },
                headerTitleAlign: "center",
                headerShadowVisible: false,
                headerBlurEffect: "systemMaterial",
                headerTransparent: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerTitle: "Trucksarthi",
                    // We'll fix the SideMenu trigger in a unified way soon
                }}
            />
        </Stack>
    );
}
