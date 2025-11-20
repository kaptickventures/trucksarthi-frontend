import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import {
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import "../../global.css";
import { THEME } from "../../theme"; // <-- theme import

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";

  // Header theme from THEME tokens
  const backgroundColor = isDark
    ? THEME.dark.background
    : THEME.light.background;

  const foregroundColor = isDark
    ? THEME.dark.foreground
    : THEME.light.foreground;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Reminders",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor },
      headerTitleStyle: { color: foregroundColor, fontWeight: "600" },
      headerTintColor: foregroundColor,
    });
  }, [navigation, isDark]);

  // Mock notifications (empty → show "no notifications")
  const notifications: any[] = [];

  // Dot badge theme colors (Tailwind tokens)
  const dotColors: Record<string, string> = {
    high: "bg-destructive",
    medium: "bg-accent",
    low: "bg-primary",
  };

  // Icon colors (using THEME tokens)
  const iconColors: Record<string, string> = {
    high: isDark ? THEME.dark.destructive : THEME.light.destructive,
    medium: isDark ? THEME.dark.accentForeground : THEME.light.accentForeground,
    low: isDark ? THEME.dark.primary : THEME.light.primary,
  };

  // Empty icon color
  const emptyIconColor = isDark
    ? THEME.dark.mutedForeground
    : THEME.light.mutedForeground;

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center mt-32">
          <Ionicons
            name="notifications-off-outline"
            size={60}
            color={emptyIconColor}
          />
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

                {/* Colored dot */}
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
