// app/(tabs)/_layout.tsx
import React from "react";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { PlatformColor, useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Choose adaptive colors based on theme
  const isDark = colorScheme === "dark";
  const tintColor = isDark
    ? PlatformColor("systemBlueColor") // iOS dynamic system color
    : PlatformColor("systemBlueColor");

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

      {/* 🕒 HISTORY */}
      <NativeTabs.Trigger name="history">
        <Icon sf="clock.fill" drawable="custom_history_drawable" />
        <Label>History</Label>
      </NativeTabs.Trigger>

      {/* ⚙️ SETTINGS (optional) */}
      <NativeTabs.Trigger name="settings">
        <Icon sf="gearshape.fill" drawable="custom_settings_drawable" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
