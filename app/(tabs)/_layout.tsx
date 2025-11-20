import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Clock, Home, PlusCircle } from "lucide-react-native";
import React from "react";
import { Platform, StatusBar, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { THEME } from "../..//theme"; // adjust path if needed

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Theme-based colors
  const backgroundColor = isDark ? THEME.dark.card : THEME.light.card;
  const tabBarBorderColor = isDark ? THEME.dark.border : THEME.light.border;

  // 💚 WhatsApp green active icons
  const activeTintColor = isDark ? THEME.dark.primary : THEME.light.primary;

  // Muted greys for inactive tabs
  const inactiveTintColor = isDark
    ? THEME.dark.mutedForeground
    : THEME.light.mutedForeground;

  if (Platform.OS === "ios") {
    return (
      <>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent={false} />
        <NativeTabs>
          <NativeTabs.Trigger name="home">
            <Icon sf="house.fill" selectedColor={activeTintColor} />
            <Label>Home</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="addTrip">
            <Icon sf="plus.circle.fill" selectedColor={activeTintColor} />
            <Label>Add Trip</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="tripLog">
            <Icon sf="clock.fill" selectedColor={activeTintColor} />
            <Label>Trip Log</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeTintColor,      // WhatsApp green
          tabBarInactiveTintColor: inactiveTintColor,  // muted grey

          tabBarStyle: {
            backgroundColor,
            borderTopWidth: 1,
            borderTopColor: tabBarBorderColor,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            elevation: 4,
          },

          sceneStyle: {
            backgroundColor,
          },
          lazy: true,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="addTrip"
          options={{
            title: "Add Trip",
            tabBarIcon: ({ color }) => <PlusCircle size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="tripLog"
          options={{
            title: "Trip Log",
            tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
