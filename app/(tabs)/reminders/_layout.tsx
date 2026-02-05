import React from "react";
import NativeStack from "expo-router/stack";
import { useThemeStore } from "../../../hooks/useThemeStore";

export default function RemindersStack() {
    const { colors } = useThemeStore();

    return (
        <NativeStack
            screenOptions={{
                headerTitle: "Reminders",
                headerTitleAlign: "center",
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: {
                    color: colors.foreground,
                    fontWeight: "600",
                },
                headerTintColor: colors.foreground,
                headerShadowVisible: false,
            }}
        >
            <NativeStack.Screen
                name="index"
                options={{
                    headerTitle: "Reminders",
                }}
            />
        </NativeStack>
    );
}
