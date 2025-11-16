// app/(tabs)/_layout.tsx
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { PlatformColor, useColorScheme, Platform } from "react-native";


export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Choose adaptive colors based on theme
  const isDark = colorScheme === "dark";
  const tintColor =
  Platform.OS === "ios"
    ? PlatformColor("systemBlueColor") // iOS system color
    : "#007aff";                      // default iOS blue as hex for Android

  return (
    <NativeTabs
      // 🧭 Behavior
      minimizeBehavior="onScrollDown"
      // 🎨 iOS/Android native tint
      tintColor={tintColor}
    >
      {/* 🏠 HOME */}
      <NativeTabs.Trigger name="home">
        <Icon sf="house.fill" drawable="custom_home_drawable" />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      {/* ➕ ADD TRIP */}
      <NativeTabs.Trigger name="addTrip">
        <Icon sf="plus.circle.fill" drawable="custom_addtrip_drawable" />
        <Label>Add Trip</Label>
      </NativeTabs.Trigger>

      {/* 🕒 Trip Log */}
      <NativeTabs.Trigger name="tripLog">
        <Icon sf="clock.fill" drawable="custom_tripLog_drawable" />
        <Label>Trip Log</Label>
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}
