import { Stack } from "expo-router";
import { useThemeStore } from "../../../../hooks/useThemeStore";
import { useDriverAppContext } from "../../../../context/DriverAppContext";
import { translations } from "../../../../constants/driver/translations";
import React from "react";

export default function LedgerLayout() {
    const { colors } = useThemeStore();
    const { language } = useDriverAppContext();
    const t = translations[language];

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
                    headerTitle: t.khata,
                }}
            />
        </Stack>
    );
}
