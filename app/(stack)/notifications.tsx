import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useLayoutEffect, useState, useEffect, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import "../../global.css";
import { useThemeStore } from "../../hooks/useThemeStore";
import API from "../api/axiosInstance";
import useTruckDocuments from "../../hooks/useTruckDocuments";
import useTrucks from "../../hooks/useTruck";
import { formatDate } from "../../lib/utils";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = colors.background;
  const foregroundColor = colors.foreground;
  const emptyIconColor = colors.mutedForeground;

  const { documents, loading: docsLoading, fetchDocuments } = useTruckDocuments();
  const { trucks, fetchTrucks } = useTrucks();

  const allNotifications = useMemo(() => {
    // Filter expiring documents (next 30 days) - same logic as HomeScreen
    const reminders = documents.filter(doc => {
      if (!doc.expiry_date || doc.status === 'expired') return false;
      const expiry = new Date(doc.expiry_date);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).map(doc => {
      const truckId = typeof doc.truck === "object" ? doc.truck?._id : doc.truck;
      const truck = trucks.find(t => String(t._id) === String(truckId));
      const truckName = truck?.registration_number || (typeof doc.truck === "object" ? doc.truck?.registration_number : 'N/A');

      return {
        _id: `reminder-${doc._id}`,
        title: `${doc.document_type} Expiring`,
        message: `Your ${doc.document_type} for truck ${truckName} is expiring on ${formatDate(doc.expiry_date)}.`,
        type: "DOC_EXPIRY",
        status: "REMINDER",
        scheduled_at: new Date().toISOString(), // Sort at top/recent
        is_reminder: true
      };
    });

    // Combine and sort by scheduled_at desc
    const combined = [...reminders, ...notifications];
    return combined.sort((a, b) => {
      const dateA = new Date(a.scheduled_at || 0).getTime();
      const dateB = new Date(b.scheduled_at || 0).getTime();
      return dateB - dateA;
    });
  }, [documents, notifications, trucks]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchNotifications(),
      fetchDocuments(),
      fetchTrucks()
    ]);
    setRefreshing(false);
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View className="flex-1 items-center justify-center mt-32">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : allNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-32">
            <Ionicons
              name="notifications-off-outline"
              size={60}
              color={emptyIconColor}
            />
            <Text className="text-lg font-medium mt-4" style={{ color: colors.mutedForeground }}>
              No notifications found
            </Text>
          </View>
        ) : (
          allNotifications.map((n) => (
            <TouchableOpacity
              key={n._id}
              className={`rounded-2xl p-4 mb-3 flex-row items-start border`}
              style={{
                backgroundColor: colors.card,
                borderColor: n.is_reminder ? colors.primary + '4D' : colors.border + '1A'
              }}
              onPress={() => handleNotificationPress(n)}
            >
              {/* Left icon */}
              <View className="mr-3 mt-1 p-2 rounded-xl" style={{ backgroundColor: colors.primary + '1A' }}>
                <Ionicons
                  name={getStatusIcon(n.type)}
                  size={24}
                  color={colors.primary}
                />
              </View>

              {/* Content */}
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-bold text-base" style={{ color: colors.foreground }}>
                    {n.title}
                  </Text>
                  {n.status === "SCHEDULED" && (
                    <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                      <Text className="text-amber-700 text-[10px] font-black uppercase">Pending</Text>
                    </View>
                  )}
                </View>

                <Text className="text-sm font-medium leading-5 mb-2" style={{ color: colors.mutedForeground }}>
                  {n.message}
                </Text>

                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={12} color={emptyIconColor} />
                  <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
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
