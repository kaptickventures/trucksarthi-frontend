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
  const backgroundColor = isDark ? "hsl(210 28% 10%)" : "hsl(0 0% 100%)";
  const foregroundColor = isDark ? "hsl(0 0% 95%)" : "hsl(210 15% 6%)";

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
  const notifications: any[] = []; // ← Empty so it shows the empty state

  // Dot Badge Colors
  const dotColors: Record<string, string> = {
    high: "bg-red-600",
    medium: "bg-amber-500",
    low: "bg-primary", // your WhatsApp green
  };

  const iconColors: Record<string, string> = {
    high: "#DC2626",
    medium: "#D97706",
    low: "#25D366", // WhatsApp green
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center mt-32">
          <Ionicons name="notifications-off-outline" size={60} color="#999" />
          <Text className="text-muted-foreground text-lg font-medium mt-4">
            No notifications found
          </Text>
        </View>
      ) : (
        notifications.map((n) => (
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
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
