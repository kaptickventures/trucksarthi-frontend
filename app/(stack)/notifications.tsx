import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "../../hooks/useThemeStore";
import API from "../api/axiosInstance";
import useTruckDocuments from "../../hooks/useTruckDocuments";
import useTrucks from "../../hooks/useTruck";
import { formatDate, formatLabel } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

type ReminderItem = {
  _id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  scheduled_at: string;
  is_reminder: true;
  daysLeft?: number;
  docLabel: string;
  truckName: string;
  expiryDate: Date;
  isExpired: boolean;
};

export default function NotificationsScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"notifications" | "reminders">(
    tab === "reminders" ? "reminders" : "notifications"
  );
  useEffect(() => {
    if (tab === "reminders") setActiveTab("reminders");
  }, [tab]);
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
  const getDaysLeftLabel = (expiry: Date) => {
    const daysLeft = getDaysLeft(expiry);
    if (daysLeft < 0) return "Expired";
    if (daysLeft === 0) return "Expires today";
    return `${daysLeft} days left`;
  };

  const reminders = useMemo<ReminderItem[]>(() => {
    const uploadedDocReminders: ReminderItem[] = documents
      .filter((doc) => {
        if (!doc.expiry_date) return false;
        const expiry = parseExpiryDate(doc.expiry_date);
        if (!expiry) return false;
        const daysLeft = getDaysLeft(expiry);
        return daysLeft <= 30;
      })
      .map((doc) => {
        const truckId = typeof doc.truck === "object" ? doc.truck?._id : doc.truck;
        const truck = trucks.find((t) => String(t._id) === String(truckId));
        const truckName = truck?.registration_number || (typeof doc.truck === "object" ? doc.truck?.registration_number : "N/A");
        const expiry = parseExpiryDate(doc.expiry_date);
        const daysLeft = expiry ? getDaysLeft(expiry) : undefined;
        const isExpired = daysLeft !== undefined && daysLeft < 0;
        const docLabel = formatLabel(doc.document_type || "Document");

        return {
          _id: `reminder-${doc._id}`,
          title: `${docLabel} ${isExpired ? "Expired" : "Expiring"}`,
          message: `Your ${docLabel} for truck ${truckName} is ${isExpired ? "already expired" : "expiring"} on ${formatDate(doc.expiry_date)}.`,
          type: "DOC_EXPIRY",
          status: "REMINDER",
          scheduled_at: new Date().toISOString(),
          is_reminder: true as const,
          daysLeft,
          docLabel,
          truckName,
          expiryDate: expiry!,
          isExpired,
        };
      });

    const truckFieldConfig: { key: string; label: string; type: string; read: (truck: any) => any }[] = [
      { key: "insurance", type: "INSURANCE", label: "Insurance", read: (truck) => truck.insurance_upto || truck?.rc_details?.vehicle_insurance_upto },
      { key: "fitness", type: "FITNESS CERTIFICATE", label: "Fitness", read: (truck) => truck.fitness_upto || truck?.rc_details?.rc_expiry_date },
      { key: "permit", type: "STATE PERMIT", label: "Permit", read: (truck) => truck.permit_upto || truck?.rc_details?.permit_valid_upto },
      { key: "pucc", type: "PUCC", label: "PUCC", read: (truck) => truck.pollution_upto || truck?.rc_details?.pucc_upto },
      { key: "road_tax", type: "ROAD TAX", label: "Road Tax", read: (truck) => truck.road_tax_upto || truck?.rc_details?.vehicle_tax_upto },
    ];

    const truckFieldReminders: ReminderItem[] = (trucks || []).flatMap((truck) => {
      const truckName = truck?.registration_number || "N/A";
      return truckFieldConfig
        .map((field) => {
          // Dedup if document already exists
          if (documents.some(d =>
            (typeof d.truck === 'object' ? d.truck?._id === truck._id : d.truck === truck._id) &&
            d.document_type?.toUpperCase().includes(field.type)
          )) return null;

          const rawExpiry = field.read(truck);
          const expiry = parseExpiryDate(rawExpiry);
          if (!expiry) return null;
          const daysLeft = getDaysLeft(expiry);
          if (daysLeft > 30) return null;
          const isExpired = daysLeft < 0;
          return {
            _id: `truck-reminder-${truck._id}-${field.key}`,
            title: `${field.label} ${isExpired ? "Expired" : "Expiring"}`,
            message: `Your ${field.label} for truck ${truckName} is ${isExpired ? "already expired" : "expiring"} on ${formatDate(expiry)}.`,
            type: "DOC_EXPIRY",
            status: "REMINDER",
            scheduled_at: new Date().toISOString(),
            is_reminder: true as const,
            daysLeft,
            docLabel: field.label,
            truckName,
            expiryDate: expiry,
            isExpired,
          };
        })
        .filter(Boolean) as ReminderItem[];
    });

    return [...uploadedDocReminders, ...truckFieldReminders];
  }, [documents, trucks]);

  const groupedReminders = useMemo(() => {
    const groups = new Map<string, ReminderItem[]>();
    reminders.forEach((item) => {
      const key = `${item.docLabel}__${item.isExpired ? "EXPIRED" : "EXPIRING"}`;
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });

    const grouped = Array.from(groups.entries()).map(([key, items]) => {
      const first = items[0];
      const truckDetails = Array.from(
        items.reduce((acc, i) => {
          const existing = acc.get(i.truckName) || [];
          existing.push(i.expiryDate);
          acc.set(i.truckName, existing);
          return acc;
        }, new Map<string, Date[]>())
      )
        .map(([truckName, dates]) => ({
          truckName,
          expiryDate: dates.sort((a, b) => a.getTime() - b.getTime())[0],
        }))
        .sort((a, b) => a.truckName.localeCompare(b.truckName));
      const minDaysLeft = Math.min(...items.map((i) => i.daysLeft ?? 9999));
      const nextExpiry = items
        .map((i) => i.expiryDate)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      const isExpired = first.isExpired;
      const verb = isExpired ? "expired" : "expiring";
      const plural = truckDetails.length > 1 ? "trucks" : "truck";

      return {
        _id: `group-${key}`,
        title: `${first.docLabel} ${isExpired ? "Expired" : "Expiring"}`,
        message: `${first.docLabel} is ${verb} for ${truckDetails.length} ${plural}.`,
        groupedTruckDetails: truckDetails,
        type: "DOC_EXPIRY",
        status: "REMINDER",
        scheduled_at: nextExpiry.toISOString(),
        is_reminder: true,
        daysLeft: minDaysLeft,
      };
    });

    return grouped.sort((a, b) => {
      const dateA = new Date(a.scheduled_at || 0).getTime();
      const dateB = new Date(b.scheduled_at || 0).getTime();
      return dateA - dateB;
    });
  }, [reminders]);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const dateA = new Date(a.scheduled_at || 0).getTime();
      const dateB = new Date(b.scheduled_at || 0).getTime();
      return dateB - dateA;
    });
  }, [notifications]);

  const visibleItems = activeTab === "reminders" ? groupedReminders : sortedNotifications;

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


  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
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

        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.card,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 4,
            marginBottom: 14,
          }}
        >
          {([
            { key: "notifications", label: t("notifications") },
            { key: "reminders", label: t("reminders") },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  paddingVertical: 10,
                  alignItems: "center",
                  backgroundColor: isActive ? colors.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.primaryForeground : colors.mutedForeground,
                    fontWeight: "800",
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading || docsLoading ? (
          <View className="flex-1 items-center justify-center mt-32">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : visibleItems.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-32">
            <Ionicons
              name="notifications-off-outline"
              size={60}
              color={emptyIconColor}
            />
            <Text className="text-lg font-medium mt-4" style={{ color: colors.mutedForeground }}>
              {activeTab === "reminders" ? "No reminders found" : t("noNotificationsFound")}
            </Text>
          </View>
        ) : (
          visibleItems.map((n) => (
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
                    <View
                      style={{
                        backgroundColor: colors.warningSoft,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ color: colors.warning, fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>
                        {t("pending")}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-sm font-medium leading-5 mb-2" style={{ color: colors.mutedForeground }}>
                  {n.message}
                </Text>
                {activeTab === "reminders" && Array.isArray((n as any).groupedTruckDetails) && (n as any).groupedTruckDetails.length > 0 && (
                  <View className="mb-2">
                    {(n as any).groupedTruckDetails.map((item: { truckName: string; expiryDate: Date }) => (
                      <Text key={`${n._id}-${item.truckName}`} className="text-sm leading-5" style={{ color: colors.mutedForeground }}>
                        * {item.truckName} - {getDaysLeftLabel(item.expiryDate)}
                      </Text>
                    ))}
                  </View>
                )}

                {!n.is_reminder && (
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={12} color={emptyIconColor} />
                    <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
                      {getTimeAgo(n.scheduled_at)}
                    </Text>
                  </View>
                )}
                </View>
              </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
