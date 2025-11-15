// app/(tabs)/home/_layout.tsx
import NativeStack from "expo-router/stack";
import React from "react";

export default function tripLogStack() {
  return (
    <NativeStack
      screenOptions={{
        headerBlurEffect: "systemMaterial",
        autoHideHomeIndicator: true,
        headerTransparent: false,
        headerShadowVisible: false,
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
