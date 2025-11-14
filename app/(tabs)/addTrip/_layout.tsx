// app/(tabs)/home/_layout.tsx
import React from "react";
import NativeStack from "expo-router/stack";

export default function AddTripStack() {
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
