import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme, View } from "react-native";

export default function TabBar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🎨 Adaptive color palette
  const colors = {
    background: isDark ? "#0E1116" : "#FFFFFF",
    border: isDark ? "#1F242B" : "#E5E5E5",
    active: isDark ? "#3B82F6" : "#1D4ED8", // blue for active icons
    inactive: isDark ? "#6B7280" : "#9CA3AF", // muted gray
    shadow: isDark ? "#00000080" : "#00000022",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -3 },
          elevation: 8,
          paddingHorizontal: 6,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
      }}
      initialRouteName="home"
    >
      {/* HOME */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* HISTORY */}
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* ADD TRIP */}
      <Tabs.Screen
        name="addtrip"
        options={{
          title: "Add Trip",
          tabBarIcon: ({ color }) => (
            <View className="items-center justify-center">
              <Ionicons
                name="add-circle"
                size={30}
                color={colors.active}
                style={{
                  shadowColor: colors.active,
                  shadowOpacity: 0.4,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 2 },
                }}
              />
            </View>
          ),
        }}
      />

      {/* MANAGER */}
      <Tabs.Screen
        name="manager"
        options={{
          title: "Manager",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
