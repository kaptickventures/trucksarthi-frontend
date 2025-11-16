import React from "react";
import { Platform, StatusBar, useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Home, PlusCircle, Clock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🔹 Adaptive colors for Android
  const backgroundColor = isDark ? "#1c1c1c" : "#ffffff";
  const tabBarBorderColor = isDark ? "#444" : "#ddd";
  const activeTintColor = "#007aff"; // consistent across themes
  const inactiveTintColor = isDark ? "#aaa" : "#888";

  if (Platform.OS === "ios") {
    return (
      <>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent={false} />
        <NativeTabs>
          <NativeTabs.Trigger name="home">
            <Icon sf="house.fill" />
            <Label>Home</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="addTrip">
            <Icon sf="plus.circle.fill" />
            <Label>Add Trip</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="tripLog">
            <Icon sf="clock.fill" />
            <Label>Trip Log</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </>
    );
  }

  return (
    <>
      <StatusBar backgroundColor={backgroundColor} barStyle={isDark ? "light-content" : "dark-content"} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeTintColor,
          tabBarInactiveTintColor: inactiveTintColor,
          tabBarStyle: {
            backgroundColor,
            borderTopWidth: 1,
            borderTopColor: tabBarBorderColor,
            height: 60 + insets.bottom, // prevent overlap with gesture bar
            paddingBottom: insets.bottom, // push content above gesture bar
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
