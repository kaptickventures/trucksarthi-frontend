import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

export default function TabBar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        // ✅ Header styling
        headerStyle: {
          backgroundColor: "#000", // always black background
        },
        headerTintColor: isDark ? "#fff" : "#000", // text color switches
        headerTitleStyle: {
          fontWeight: "600",
        },

        // ✅ Tab bar styling
        tabBarStyle: {
          backgroundColor: "#000", // always black background
          borderTopColor: "#111",
          height: 60,
        },
        tabBarActiveTintColor: isDark ? "#fff" : "#000", // active icons text color changes
        tabBarInactiveTintColor: isDark ? "#888" : "#666",
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerTitle: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerTitle: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="addtrip"
        options={{
          title: "Add Trip",
          headerTitle: "Add Trip",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="manager"
        options={{
          title: "Manager",
          headerTitle: "Manager",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
