
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState, useCallback, useEffect, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";

import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";
import SideMenu from "../../../components/SideMenu";
import { Skeleton } from "../../../components/Skeleton";
import "../../../global.css";
import { useThemeStore } from "../../../hooks/useThemeStore";
import useTrips from "../../../hooks/useTrip";
import { useUser } from "../../../hooks/useUser";
import useTruckDocuments from "../../../hooks/useTruckDocuments";
import useDrivers from "../../../hooks/useDriver";
import useClients from "../../../hooks/useClient";
import useTrucks from "../../../hooks/useTruck";
import useLocations from "../../../hooks/useLocation";
import { formatDate } from "../../../lib/utils";
import { useTranslation } from "../../../context/LanguageContext";
import { NotificationBadge } from "../../../components/NotificationBadge";


export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [recentTripsVisibleCount, setRecentTripsVisibleCount] = useState(5);
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const quickActionIconBg = colors.accent;
  const quickActionIconColor = colors.primary;
  const quickActions = [
    { title: "Driver khata", icon: "person-outline", route: "/driver-ledger" },
    { title: "Client khata", icon: "people-outline", route: "/client-ledger" },
    { title: "Truck khata", icon: "bus-outline", route: "/truck-khata" },
    { title: "Misc transactions", icon: "swap-horizontal-outline", route: "/misc-transactions" },
    { title: "Truck Manager", icon: "folder-outline", route: "/truck-manager" },
  ] as const;
  const quickActionRows = [quickActions.slice(0, 3), quickActions.slice(3, 5)];


  const [refreshing, setRefreshing] = useState(false);
  const { user, loading: userLoading, refreshUser } = useUser();
  const { loading: tripsLoading, totalRevenue, totalTrips, recentTrips, fetchTrips } = useTrips();
  const { documents, loading: docsLoading, fetchDocuments } = useTruckDocuments();
  const { drivers, fetchDrivers } = useDrivers();
  const { clients, fetchClients } = useClients();
  const { trucks, fetchTrucks } = useTrucks();
  const { locations, fetchLocations } = useLocations();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUser(),
      fetchTrips(),
      fetchDocuments(),
      fetchDrivers(),
      fetchClients(),
      fetchTrucks(),
      fetchLocations()
    ]);
    setRefreshing(false);
  }, [refreshUser, fetchTrips, fetchDocuments, fetchDrivers, fetchClients, fetchTrucks, fetchLocations]);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
    }, [])
  );

  const toShortId = (value: any): string => {
    if (!value) return "N/A";
    const raw = typeof value === "object" ? value?._id : value;
    const str = raw != null ? String(raw) : "";
    return str ? str.slice(-6) : "N/A";
  };

  const getTruckName = useCallback((truckOrId: any): string => {
    if (!truckOrId) return "N/A";
    const id = typeof truckOrId === "object" ? truckOrId?._id : truckOrId;
    const sId = id ? String(id) : "";

    // 1. Try to find in the fetched trucks list for consistency
    const found = trucks?.find(t => String(t._id) === sId);
    if (found) return found.registration_number || "N/A";

    // 2. Fallback to properties on the object itself if populated
    if (typeof truckOrId === "object") {
      return truckOrId.registration_number || toShortId(sId);
    }

    // 3. Last resort: short ID
    return toShortId(sId);
  }, [trucks]);

  const getDriverName = (driverOrId: any): string => {
    if (!driverOrId) return "N/A";
    const id = typeof driverOrId === "object" ? driverOrId?._id : driverOrId;
    const sId = id ? String(id) : "";

    // 1. Try to find in the fetched drivers list (which has mapDriverFromApi applied)
    const found = drivers?.find(d => String(d._id) === sId);
    if (found) return found.driver_name || found.name || "N/A";

    // 2. Fallback to properties on the object itself
    if (typeof driverOrId === "object") {
      return driverOrId.driver_name || driverOrId.name || toShortId(sId);
    }

    return toShortId(sId);
  };

  const getClientName = (clientOrId: any): string => {
    if (!clientOrId) return "N/A";
    const id = typeof clientOrId === "object" ? clientOrId?._id : clientOrId;
    const sId = id ? String(id) : "";

    // 1. Try local list
    const found = clients?.find(c => String(c._id) === sId);
    if (found) return found.client_name || "N/A";

    // 2. Try object fields
    if (typeof clientOrId === "object") {
      return clientOrId.client_name || toShortId(sId);
    }

    return toShortId(sId);
  };

  const getLocationName = (locationOrId: any): string => {
    if (!locationOrId) return "N/A";
    const id = typeof locationOrId === "object" ? locationOrId?._id : locationOrId;
    const sId = id ? String(id) : "";

    const found = locations?.find(l => String(l._id) === sId);
    if (found) return found.location_name || "N/A";

    if (typeof locationOrId === "object") {
      return locationOrId.location_name || toShortId(sId);
    }

    return toShortId(sId);
  };

  const parseExpiryDate = (value: any): Date | null => {
    if (!value) return null;
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;
    if (typeof value !== "string") return null;

    const normalized = value.trim();
    const parts = normalized.split(/[-/]/);
    if (parts.length === 3) {
      // Supports DD-MM-YYYY / DD/MM/YYYY fallback
      const [p1, p2, p3] = parts.map((p) => Number(p));
      if (p1 > 0 && p2 > 0 && p3 > 999) {
        const d = new Date(p3, p2 - 1, p1);
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
    return null;
  };

  const isWithinReminderWindow = (expiry: Date): boolean => {
    const today = new Date();
    const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = expiryStart.getTime() - todayStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Showing reminders for everything expired or expiring within 30 days
    return diffDays <= 30;
  };
  const getDaysLeftLabel = (expiry: Date): string => {
    const today = new Date();
    const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = expiryStart.getTime() - todayStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    return `${diffDays} days left`;
  };

  type HomeReminder = {
    key: string;
    label: string;
    truck: any;
    expiry: Date;
  };
  type GroupedHomeReminder = {
    key: string;
    label: string;
    truckItems: { name: string; expiry: Date }[];
    expiry: Date;
    count: number;
  };

  // Uploaded truck-document reminders
  const docReminders: HomeReminder[] = documents
    .map((doc) => {
      const rawExpiry = (doc as any).expiry_date ?? (doc as any).expiryDate;
      const expiry = parseExpiryDate(rawExpiry);
      if (!expiry || !isWithinReminderWindow(expiry)) return null;

      const isExpired = expiry.getTime() < new Date().setHours(0, 0, 0, 0);
      return {
        key: `doc-${doc._id}`,
        label: `${doc.document_type} ${isExpired ? 'Expired' : 'Expiring'}`,
        truck: doc.truck,
        expiry,
      } as HomeReminder;
    })
    .filter(Boolean) as HomeReminder[];

  // Truck-level reminders from API expiry fields (works even without uploaded docs)
  const truckFieldReminders = useMemo(() => {
    const fields: { key: string; label: string; type: string; read: (truck: any) => any }[] = [
      { key: "insurance", type: "INSURANCE", label: "Insurance", read: (truck) => truck.insurance_upto || truck?.rc_details?.vehicle_insurance_upto },
      { key: "fitness", type: "FITNESS CERTIFICATE", label: "Fitness", read: (truck) => truck.fitness_upto || truck?.rc_details?.rc_expiry_date },
      { key: "permit", type: "STATE PERMIT", label: "Permit", read: (truck) => truck.permit_upto || truck?.rc_details?.permit_valid_upto },
      { key: "pucc", type: "PUCC", label: "PUCC", read: (truck) => truck.pollution_upto || truck?.rc_details?.pucc_upto },
      { key: "road_tax", type: "ROAD TAX", label: "Road Tax", read: (truck) => truck.road_tax_upto || truck?.rc_details?.vehicle_tax_upto },
    ];

    const reminders: HomeReminder[] = [];
    for (const truck of trucks || []) {
      for (const field of fields) {
        // Skip if there's already an uploaded document for this truck and type
        const hasUploadedDoc = documents.some(d =>
          (typeof d.truck === 'object' ? d.truck?._id === truck._id : d.truck === truck._id) &&
          d.document_type?.toUpperCase().includes(field.type)
        );
        if (hasUploadedDoc) continue;

        const expiry = parseExpiryDate(field.read(truck));
        if (!expiry || !isWithinReminderWindow(expiry)) continue;

        const isExpired = expiry.getTime() < new Date().setHours(0, 0, 0, 0);
        reminders.push({
          key: `truck-${truck._id}-${field.key}`,
          label: `${field.label} ${isExpired ? 'Expired' : 'Expiring'}`,
          truck,
          expiry,
        });
      }
    }
    return reminders;
  }, [trucks, documents]);

  const groupedReminderDocs = useMemo<GroupedHomeReminder[]>(() => {
    const groups = new Map<string, HomeReminder[]>();
    [...docReminders, ...truckFieldReminders].forEach((item) => {
      const existing = groups.get(item.label) || [];
      existing.push(item);
      groups.set(item.label, existing);
    });

    return Array.from(groups.entries())
      .map(([label, items]) => {
        const byTruck = new Map<string, Date[]>();
        items.forEach((i) => {
          const name = getTruckName(i.truck);
          const existing = byTruck.get(name) || [];
          existing.push(i.expiry);
          byTruck.set(name, existing);
        });
        const truckItems = Array.from(byTruck.entries())
          .map(([name, dates]) => ({
            name,
            expiry: dates.sort((a, b) => a.getTime() - b.getTime())[0],
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        const nextExpiry = items.map((i) => i.expiry).sort((a, b) => a.getTime() - b.getTime())[0];
        return {
          key: `group-${label.replace(/\s+/g, "-").toLowerCase()}`,
          label,
          truckItems,
          expiry: nextExpiry,
          count: truckItems.length,
        };
      })
      .sort((a, b) => a.expiry.getTime() - b.expiry.getTime())
      .slice(0, 5);
  }, [docReminders, truckFieldReminders, getTruckName]);

  const totalReminderCount = docReminders.length + truckFieldReminders.length;
  const statsCardStyle = { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border } as const;
  const sectionCardStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card,
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.12)" : colors.border,
  } as const;
  const nestedListCardStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.1)",
  } as const;

  useEffect(() => {
    setRecentTripsVisibleCount(5);
  }, [recentTrips.length]);

  const visibleRecentTrips = useMemo(
    () => recentTrips.slice(0, recentTripsVisibleCount),
    [recentTrips, recentTripsVisibleCount]
  );

  const handleLoadMoreTrips = () => {
    if (recentTripsVisibleCount < 10) {
      setRecentTripsVisibleCount(Math.min(10, recentTrips.length));
      return;
    }
    setRecentTripsVisibleCount(recentTrips.length);
  };

  const loading = userLoading || tripsLoading || docsLoading;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: "transparent",
      },
      headerBackground: () => (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        />
      ),
      headerTitleStyle: {
        color: colors.foreground,
        fontWeight: "800",
        fontSize: 22,
      },
      headerTintColor: colors.foreground,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={menuVisible ? "close" : "menu"}
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/(stack)/notifications" as any)}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <NotificationBadge
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
      ),
    });
  }, [colors, isDark, menuVisible, navigation, router]);

  if (loading && !user) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} className="flex-1 p-4">
        {/* Stats Skeleton */}
        <View className="flex-row justify-between mb-4">
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16, marginRight: 8 }} />
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16, marginLeft: 8 }} />
        </View>

        {/* Add Trip Button Skeleton */}
        <Skeleton width="100%" height={56} borderRadius={28} style={{ marginBottom: 12 }} />

        {/* Quick Actions Skeleton */}
        <View className="flex-row flex-wrap justify-between mt-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={{ width: "32%", height: 92, borderRadius: 16, marginBottom: 8 }} />
          ))}
        </View>

        {/* Reminders Skeleton */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Skeleton width={100} height={20} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>
          {[1, 2].map(i => (
            <Skeleton key={i} width="100%" height={60} borderRadius={12} style={{ marginBottom: 8 }} />
          ))}
        </View>

        {/* Recent Trips Skeleton */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Skeleton width={120} height={20} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} width="100%" height={70} borderRadius={12} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "900" }}>Welcome!</Text>
        </View>

        {/* ====== Stats Section ====== */}
        <View className="flex-row justify-between mb-4 mt-2">
          <View
            style={statsCardStyle}
            className="flex-1 rounded-2xl p-4 mr-2"
          >
            <Text className="text-muted-foreground text-xs">{t('monthlyRevenue')}</Text>
            <Text style={{ color: colors.foreground }} className="text-xl font-bold mt-1">
              ₹{totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View
            style={statsCardStyle}
            className="flex-1 rounded-2xl p-4 ml-2"
          >
            <Text className="text-muted-foreground text-xs">{t('numberOfTrips')}</Text>
            <Text style={{ color: colors.foreground }} className="text-xl font-bold mt-1">
              {totalTrips}
            </Text>
          </View>
        </View>

        {/* ====== Add Trip Button ====== */}
        <TouchableOpacity
          onPress={() => router.push("/addTrip")}
          style={{ backgroundColor: colors.primary }}
          className="rounded-full p-4 flex-row justify-center items-center mb-3"
        >
          <Ionicons name="add-outline" size={20} color={colors.primaryForeground} />
          <Text style={{ color: colors.primaryForeground }} className="font-semibold text-base ml-2">{t('addTrip')}</Text>
        </TouchableOpacity>

        {/* ====== Quick Actions ====== */}
        <View className="mt-2 mb-6">
          <View className="flex-row justify-between mb-2">
            {quickActionRows[0].map((item, idx) => (
              <TouchableOpacity
                key={`row1-${idx}`}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.card,
                  width: "31%",
                  minHeight: 92,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                className="rounded-2xl items-center justify-center px-2 py-2"
              >
                <View
                  className="rounded-full items-center justify-center mb-2"
                  style={{ width: 34, height: 34, backgroundColor: quickActionIconBg }}
                >
                  <Ionicons name={item.icon as any} size={18} color={quickActionIconColor} />
                </View>
                <Text
                  className="text-muted-foreground text-[11px] text-center font-semibold"
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
            {quickActionRows[1].map((item, idx) => (
              <TouchableOpacity
                key={`row2-${idx}`}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.card,
                  width: "36%",
                  minHeight: 92,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                className="rounded-2xl items-center justify-center px-2 py-2"
              >
                <View
                  className="rounded-full items-center justify-center mb-2"
                  style={{ width: 34, height: 34, backgroundColor: quickActionIconBg }}
                >
                  <Ionicons name={item.icon as any} size={18} color={quickActionIconColor} />
                </View>
                <Text
                  className="text-muted-foreground text-[11px] text-center font-semibold"
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ====== Reminders Card ====== */}
        <View
          style={sectionCardStyle}
          className="rounded-2xl p-4 mb-6"
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.foreground }} className="font-semibold text-lg">{t('reminders')}</Text>
            {totalReminderCount > 0 && (
              <TouchableOpacity onPress={() => router.push("/(stack)/notifications?tab=reminders" as any)}>
                <Text className="text-muted-foreground text-sm">{t('viewAll')} →</Text>
              </TouchableOpacity>
            )}
          </View>

          {groupedReminderDocs.length > 0 ? (
            groupedReminderDocs.map((item) => {
              const dateStr = formatDate(item.expiry);

              return (
                <View
                  key={item.key}
                  style={nestedListCardStyle}
                  className="flex-row justify-between items-center p-3 rounded-xl mb-2"
                >
                  <View className="flex-1">
                    <Text style={{ color: colors.foreground }} className="font-medium text-sm">
                      {item.label}
                    </Text>
                    <Text className="text-muted-foreground text-[10px] mt-1">
                      {item.count} {item.count > 1 ? "trucks" : "truck"}
                    </Text>
                    <View className="mt-1">
                      {item.truckItems.map((truckItem) => (
                        <Text key={`${item.key}-${truckItem.name}`} className="text-muted-foreground text-[10px]">
                          * {truckItem.name} - {getDaysLeftLabel(truckItem.expiry)}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text style={{ color: colors.destructive }} className="font-semibold text-xs">
                      {dateStr}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-muted-foreground text-center py-4">
              {t('allDocsUpToDate')}
            </Text>
          )}
        </View>

        {/* ====== Recent Trips ====== */}
        <View
          style={sectionCardStyle}
          className="rounded-2xl p-4 mb-6"
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.foreground }} className="font-semibold text-lg">{t('recentTrips')}</Text>
            <TouchableOpacity onPress={() => router.push("/tripLog")}>
              <Text className="text-muted-foreground text-sm">{t('viewAll')} →</Text>
            </TouchableOpacity>
          </View>

          {recentTrips.length > 0 ? (
            visibleRecentTrips.map((trip) => {

              const tripId = trip?._id;


              const dateStr = trip.trip_date
                ? formatDate(trip.trip_date)
                : "No Date";
              const cost =
                Number(trip.cost_of_trip || 0) +
                Number(trip.miscellaneous_expense || 0);

              return (
                <View
                  key={tripId}
                  style={nestedListCardStyle}
                  className="flex-row justify-between items-center p-3 rounded-xl mb-2"
                >
                  <View className="flex-1">
                    <Text style={{ color: colors.foreground }} className="font-medium text-sm">
                      {getLocationName(trip.start_location)} → {getLocationName(trip.end_location)}
                    </Text>
                    <Text className="text-muted-foreground text-[10px] mt-1" numberOfLines={1} ellipsizeMode="tail">
                      Truck: {getTruckName(trip.truck)}
                    </Text>
                    <Text className="text-muted-foreground text-[10px] mt-0.5" numberOfLines={1} ellipsizeMode="tail">
                      Driver: {getDriverName(trip.driver)}
                    </Text>
                    <Text className="text-muted-foreground text-[10px] mt-0.5" numberOfLines={1} ellipsizeMode="tail">
                      Client: {getClientName(trip.client)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text style={{ color: colors.primary }} className="font-semibold">
                      ₹{cost.toLocaleString()}
                    </Text>
                    <Text className="text-muted-foreground text-[10px]">
                      {dateStr}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-muted-foreground text-center py-4">
              {t('noTripsFound')}
            </Text>
          )}

          {recentTrips.length > recentTripsVisibleCount && (
            <TouchableOpacity
              onPress={handleLoadMoreTrips}
              className="mt-2 p-2 rounded-lg items-center"
            >
              <Text style={{ color: colors.success }} className="text-xs font-semibold">
                {recentTripsVisibleCount < 10 ? "view more" : "View all"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}
