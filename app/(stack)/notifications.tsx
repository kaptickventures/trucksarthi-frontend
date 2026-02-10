import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  useColorScheme,
  View,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import "../../global.css";
import { THEME } from "../../theme";
import API from "../api/axiosInstance";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Theme colors
  const backgroundColor = isDark ? THEME.dark.background : THEME.light.background;
  const foregroundColor = isDark ? THEME.dark.foreground : THEME.light.foreground;
  const emptyIconColor = isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Notifications",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor },
      headerTitleStyle: { color: foregroundColor, fontWeight: "600" },
      headerTintColor: foregroundColor,
    });
  }, [backgroundColor, foregroundColor, navigation]);

  const fetchNotifications = async () => {
    try {
      const response = await API.get("/api/notifications/my");
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = (n: any) => {
    if (n.deep_link) {
      // Logic for deep linking could go here
      console.log("Navigating to:", n.deep_link);
      // Example: router.push(n.deep_link)
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "TRIP_REMINDER": return "car-outline";
      case "DOC_EXPIRY": return "document-text-outline";
      case "HABIT": return "calendar-outline";
      default: return "notifications-outline";
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMin = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMin / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMin < 1) return "Just now";
    if (diffInMin < 60) return `${diffInMin}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={foregroundColor} />
        }
      >
        {loading ? (
          <View className="flex-1 items-center justify-center mt-32">
            <ActivityIndicator size="large" color={foregroundColor} />
          </View>
        ) : notifications.length === 0 ? (
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
            <TouchableOpacity
              key={n._id}
              className="bg-card rounded-2xl p-4 mb-3 flex-row items-start border border-border/10"
              onPress={() => handleNotificationPress(n)}
            >
              {/* Left icon */}
              <View className="mr-3 mt-1 p-2 bg-primary/10 rounded-xl">
                <Ionicons
                  name={getStatusIcon(n.type)}
                  size={24}
                  color={isDark ? THEME.dark.primary : THEME.light.primary}
                />
              </View>

              {/* Content */}
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-card-foreground font-bold text-base">
                    {n.title}
                  </Text>
                  {n.status === "SCHEDULED" && (
                    <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                      <Text className="text-amber-700 text-[10px] font-black uppercase">Pending</Text>
                    </View>
                  )}
                </View>

                <Text className="text-muted-foreground text-sm font-medium leading-5 mb-2">
                  {n.message}
                </Text>

                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={12} color={emptyIconColor} />
                  <Text className="text-muted-foreground text-xs ml-1">
                    {getTimeAgo(n.scheduled_at)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
