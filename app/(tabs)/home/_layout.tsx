// app/(tabs)/home/_layout.tsx
import React from "react";
import NativeStack from "expo-router/stack";
import { View } from "react-native";
import { useThemeStore } from "../../../hooks/useThemeStore";

export default function HomeStack() {
  const { colors } = useThemeStore();

  return (
    <NativeStack
      screenOptions={{
        headerBlurEffect: "systemMaterial",
        autoHideHomeIndicator: true,
        headerTransparent: false,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          />
        ),
      }}
    >
      <NativeStack.Screen
        name="index" // This means app/(tabs)/home/index.tsx
        options={{
            headerTitle: "Trucksarthi",
            headerTitleAlign: "center",
        }}
      />
    </NativeStack>
  );
}
