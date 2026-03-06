import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useMemo } from "react";
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
import { useTranslation } from "../../context/LanguageContext";

export default function NotificationsScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const emptyIconColor = colors.mutedForeground;

  const { documents, loading: docsLoading, fetchDocuments } = useTruckDocuments();
  const { trucks, fetchTrucks } = useTrucks();

  const parseExpiryDate = (value: any): Date | null => {
    if (!value) return null;
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;
    if (typeof value !== "string") return null;

    const normalized = value.trim();
    const parts = normalized.split(/[-/]/);
    if (parts.length === 3) {
      const [p1, p2, p3] = parts.map((p) => Number(p));
      if (p1 > 0 && p2 > 0 && p3 > 999) {
        const d = new Date(p3, p2 - 1, p1);
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
    return null;
  };

  const getDaysLeft = (expiry: Date) => {
    const today = new Date();
    const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = expiryStart.getTime() - todayStart.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const allNotifications = useMemo(() => {
    const reminders = documents
      .filter((doc) => {
        if (!doc.expiry_date || doc.status === "expired") return false;
        const expiry = parseExpiryDate(doc.expiry_date);
        if (!expiry) return false;
        const daysLeft = getDaysLeft(expiry);
        return daysLeft >= 0 && daysLeft <= 30;
      })
      .map((doc) => {
        const truckId = typeof doc.truck === "object" ? doc.truck?._id : doc.truck;
        const truck = trucks.find((t) => String(t._id) === String(truckId));
        const truckName = truck?.registration_number || (typeof doc.truck === "object" ? doc.truck?.registration_number : "N/A");
        const expiry = parseExpiryDate(doc.expiry_date);
        const daysLeft = expiry ? getDaysLeft(expiry) : undefined;

        return {
          _id: `reminder-${doc._id}`,
          title: `${doc.document_type} Expiring`,
          message: `Your ${doc.document_type} for truck ${truckName} is expiring on ${formatDate(doc.expiry_date)}.`,
          type: "DOC_EXPIRY",
          status: "REMINDER",
          scheduled_at: new Date().toISOString(),
          is_reminder: true,
          daysLeft,
        };
      });

    const truckFieldConfig: { key: string; label: string; read: (truck: any) => any }[] = [
      { key: "insurance", label: "Insurance", read: (truck) => truck.insurance_upto || truck?.rc_details?.vehicle_insurance_upto },
      { key: "fitness", label: "Fitness", read: (truck) => truck.fitness_upto || truck?.rc_details?.rc_expiry_date },
      { key: "permit", label: "Permit", read: (truck) => truck.permit_upto || truck?.rc_details?.permit_valid_upto },
      { key: "pucc", label: "PUCC", read: (truck) => truck.pollution_upto || truck?.rc_details?.pucc_upto },
      { key: "road_tax", label: "Road Tax", read: (truck) => truck.road_tax_upto || truck?.rc_details?.vehicle_tax_upto },
    ];

    const truckFieldReminders = (trucks || []).flatMap((truck) => {
      const truckName = truck?.registration_number || "N/A";
      return truckFieldConfig
        .map((field) => {
          const rawExpiry = field.read(truck);
          const expiry = parseExpiryDate(rawExpiry);
          if (!expiry) return null;
          const daysLeft = getDaysLeft(expiry);
          if (daysLeft < 0 || daysLeft > 30) return null;
          return {
            _id: `truck-reminder-${truck._id}-${field.key}`,
            title: `${field.label} Expiring`,
            message: `Your ${field.label} for truck ${truckName} is expiring on ${formatDate(expiry)}.`,
            type: "DOC_EXPIRY",
            status: "REMINDER",
            scheduled_at: new Date().toISOString(),
            is_reminder: true,
            daysLeft,
          };
        })
        .filter(Boolean);
    });

    const combined = [...reminders, ...truckFieldReminders, ...notifications];
    return combined.sort((a, b) => {
      const dateA = new Date(a.scheduled_at || 0).getTime();
      const dateB = new Date(b.scheduled_at || 0).getTime();
      return dateB - dateA;
    });
  }, [documents, notifications, trucks]);

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

    if (diffInMin < 1) return t("justNow");
    if (diffInMin < 60) return `${diffInMin}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const getReminderLevel = (daysLeft?: number) => {
    if (typeof daysLeft !== "number") return null;
    if (daysLeft <= 7) return { label: "Reminder - 7 days", bg: "#fee2e2", text: "#b91c1c" };
    if (daysLeft <= 15) return { label: "Reminder - 15 days", bg: "#ffedd5", text: "#c2410c" };
    return { label: "Reminder - 30 days", bg: "#fef3c7", text: "#a16207" };
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('notifications')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Stay updated with your fleet activity</Text>
        </View>

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
              {t("noNotificationsFound")}
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
            >
              <View className="mr-3 mt-1 p-2 rounded-xl" style={{ backgroundColor: colors.primary + '1A' }}>
                <Ionicons
                  name={getStatusIcon(n.type)}
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-bold text-base" style={{ color: colors.foreground }}>
                    {n.title}
                  </Text>
                  {n.status === "SCHEDULED" && (
                    <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                      <Text className="text-amber-700 text-[10px] font-black uppercase">{t("pending")}</Text>
                    </View>
                  )}
                </View>

                <Text className="text-sm font-medium leading-5 mb-2" style={{ color: colors.mutedForeground }}>
                  {n.message}
                </Text>

                <View className="flex-row items-center">
                  {n.is_reminder ? (
                    (() => {
                      const level = getReminderLevel(n.daysLeft);
                      if (!level) return null;
                      return (
                        <View style={{ backgroundColor: level.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                          <Text style={{ color: level.text, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>
                            {level.label}
                          </Text>
                        </View>
                      );
                    })()
                  ) : (
                    <>
                      <Ionicons name="time-outline" size={12} color={emptyIconColor} />
                      <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
                        {getTimeAgo(n.scheduled_at)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
