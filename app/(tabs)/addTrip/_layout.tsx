// app/(tabs)/addtrip-stack/_layout.tsx
import React from "react";
import NativeStack from "expo-router/stack";

export default function AddTripStack() {
  return (
    <NativeStack
      screenOptions={{
        headerLargeTitle: true,
        headerBlurEffect: "systemMaterial",
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      <NativeStack.Screen
        name="index"
        options={{
          headerTitle: "Add New Trip",
          headerTitleAlign: "center",
        }}
      />
      <NativeStack.Screen
        name="confirm"
        options={{ title: "Confirm Trip" }}
      />
    </NativeStack>
  );
}
