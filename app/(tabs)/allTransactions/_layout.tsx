import React from "react";
import NativeStack from "expo-router/stack";
import { View } from "react-native";
import { useThemeStore } from "../../../hooks/useThemeStore";

export default function AllTransactionsStack() {
  const { colors } = useThemeStore();

  return (
    <NativeStack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "transparent",
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
        name="index"
        options={{
          headerTitle: "Trucksarthi",
          headerTitleAlign: "center",
        }}
      />
    </NativeStack>
  );
}
