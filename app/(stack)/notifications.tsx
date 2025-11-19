import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import "../../global.css";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Header theme
  const backgroundColor = isDark ? "hsl(220 15% 8%)" : "hsl(0 0% 100%)";
  const foregroundColor = isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 4%)";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Reminders",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor },
      headerTitleStyle: { color: foregroundColor, fontWeight: "600" },
      headerTintColor: foregroundColor,
    });
  }, [navigation, isDark]);

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: "RC Renewal Due Soon",
      message: "Truck DL10AB1234 RC expires on Feb 15.",
      time: "Just now",
      type: "high",
    },
    {
      id: 2,
      title: "Insurance Expiring",
      message: "Insurance for Truck HR55XY9087 expires next week.",
      time: "10 min ago",
      type: "medium",
    },
    {
      id: 3,
      title: "Driver Shift Completed",
      message: "Driver Ramesh completed his scheduled shift.",
      time: "1 hour ago",
      type: "low",
    },
    {
      id: 4,
      title: "New Client Added",
      message: "Client ‘Mahadev Logistics’ has been added.",
      time: "Yesterday",
      type: "low",
    },
    {
      id: 5,
      title: "Truck Service Reminder",
      message: "Truck PB11C2299 needs servicing in 3 days.",
      time: "2 days ago",
      type: "medium",
    },
    {
      id: 6,
      title: "Trip Completed",
      message: "Trip #245 successfully completed.",
      time: "2 days ago",
      type: "low",
    },
  ];

  // Dot Badge Colors
  const dotColors: Record<string, string> = {
    high: "bg-red-600",
    medium: "bg-amber-500",
    low: "bg-blue-600",
  };

  const iconColors: Record<string, string> = {
    high: "#DC2626",
    medium: "#D97706",
    low: "#2563EB",
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {notifications.map((n) => (
        <View
          key={n.id}
          className="bg-card rounded-2xl p-4 mb-3 flex-row items-start"
        >
          {/* Left icon */}
          <View className="mr-3 mt-1">
            <Ionicons
              name={
                n.type === "high"
                  ? "alert-circle"
                  : n.type === "medium"
                  ? "warning"
                  : "information-circle"
              }
              size={26}
              color={iconColors[n.type]}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-card-foreground font-semibold text-base">
                {n.title}
              </Text>

              {/* COLORED DOT ONLY */}
              <View
                className={`w-3 h-3 rounded-full ml-2 ${dotColors[n.type]}`}
              />
            </View>

            <Text className="text-muted-foreground text-sm mb-2">
              {n.message}
            </Text>

            <Text className="text-muted-foreground text-xs">{n.time}</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
