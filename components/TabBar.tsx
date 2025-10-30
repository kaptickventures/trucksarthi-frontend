import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme, View } from "react-native";

export default function TabBar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bgColor = isDark ? "#000" : "#fff";
  const activeTint = isDark ? "#fff" : "#000";
  const inactiveTint = isDark ? "#777" : "#bbb";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0, // 👈 stick to bottom
          left: 0,
          right: 0,
          borderTopLeftRadius: 25, // 👈 only top curves
          borderTopRightRadius: 25,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: bgColor,
          borderTopWidth: 0,
          shadowColor: isDark ? "#000" : "#00000022",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
          paddingHorizontal: 6,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
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
              <Ionicons name="add-circle" size={30} color={color} />
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
