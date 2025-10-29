import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme, View } from "react-native";

export default function TabBar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bgClass = isDark ? "bg-black" : "bg-white";
  const activeTint = isDark ? "#fff" : "#000";
  const inactiveTint = isDark ? "#777" : "#bbb";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 25,
          left: 20,
          right: 20,
          height: 70,
          marginHorizontal: 10,
          marginBottom: 5,
          borderRadius: 35,
          backgroundColor: isDark ? "#000" : "#fff",
          borderTopWidth: 0,
          shadowColor: isDark ? "#000" : "#00000022",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
          paddingTop: 10,
          paddingHorizontal: 6,
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
            <View className={`items-center justify-center ${bgClass} `}>
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
            <View className="items-center justify-center ">
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* ADD TRIP (center icon) */}
      <Tabs.Screen
        name="addtrip"
        options={{
          title: "Add Trip",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center ">
              <Ionicons
                name="add-circle"
                size={30}
                color={color}
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
            <View className="items-center justify-center ">
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
            <View className="items-center justify-center ">
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
