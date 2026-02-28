
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState, useCallback, useEffect, useMemo } from "react";
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


export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [recentTripsVisibleCount, setRecentTripsVisibleCount] = useState(5);
  const { colors } = useThemeStore();
  const { t } = useTranslation();


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
  }, []);

  const toShortId = (value: any): string => {
    if (!value) return "N/A";
    const raw = typeof value === "object" ? value?._id : value;
    const str = raw != null ? String(raw) : "";
    return str ? str.slice(-6) : "N/A";
  };

  const getTruckName = (truckOrId: any): string => {
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
  };

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

  // Filter expiring documents (next 30 days)
  const expiringDocs = documents.filter(doc => {
    if (!doc.expiry_date || doc.status === 'expired') return false;
    const expiry = new Date(doc.expiry_date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });
  const latestReminderDocs = useMemo(
    () =>
      [...expiringDocs]
        .sort((a: any, b: any) => new Date(b.expiry_date || 0).getTime() - new Date(a.expiry_date || 0).getTime())
        .slice(0, 5),
    [expiringDocs]
  );

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
      headerStyle: { backgroundColor: colors.background },
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
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
      ),
    });
  }, [colors, menuVisible, navigation, router]);

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
        {/* ====== Stats Section ====== */}
        <View className="flex-row justify-between mb-4">
          <View style={{ backgroundColor: colors.card }} className="flex-1 rounded-2xl p-4 mr-2">
            <Text className="text-muted-foreground text-xs">{t('monthlyRevenue')}</Text>
            <Text style={{ color: colors.foreground }} className="text-xl font-bold mt-1">
              ₹{totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={{ backgroundColor: colors.card }} className="flex-1 rounded-2xl p-4 ml-2">
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
          <Ionicons name="bus-outline" size={20} color="white" />
          <Text style={{ color: colors.primaryForeground }} className="font-semibold text-base ml-2">{t('addTrip')}</Text>
        </TouchableOpacity>

        {/* ====== Quick Actions ====== */}
        <View className="flex-row flex-wrap justify-between mt-2 mb-6">
          {[
            { title: "Driver khata", icon: "person-outline", route: "/driver-ledger", iconBg: "#DBEAFE", iconColor: "#1D4ED8" },
            { title: "Client khata", icon: "people-outline", route: "/client-ledger", iconBg: "#DCFCE7", iconColor: "#166534" },
            { title: "Document Manager", icon: "document-text-outline", route: "/documents-manager", iconBg: "#FEF3C7", iconColor: "#92400E" },
            { title: "Running expense", icon: "speedometer-outline", route: "/running-expenses", iconBg: "#FCE7F3", iconColor: "#9D174D" },
            { title: "Maintenance khata", icon: "build-outline", route: "/maintenance-khata", iconBg: "#EDE9FE", iconColor: "#5B21B6" },
            { title: "Misc transactions", icon: "swap-horizontal-outline", route: "/misc-transactions", iconBg: "#E0F2FE", iconColor: "#0C4A6E" },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.card,
                width: "32%",
                marginBottom: 8,
                minHeight: 92,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
              className="rounded-2xl items-center justify-center px-2 py-2"
            >
              <View
                className="rounded-full items-center justify-center mb-2"
                style={{ width: 34, height: 34, backgroundColor: item.iconBg }}
              >
                <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
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

        {/* ====== Reminders Card ====== */}
        <View style={{ backgroundColor: colors.card }} className="rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.foreground }} className="font-semibold text-lg">{t('reminders')}</Text>
            <TouchableOpacity onPress={() => router.push("/(stack)/notifications" as any)}>
              <Text className="text-muted-foreground text-sm">{t('viewAll')} →</Text>
            </TouchableOpacity>
          </View>

          {latestReminderDocs.length > 0 ? (
            latestReminderDocs.map((doc) => {
              const getId = (obj: any): string =>
                typeof obj === "object" ? obj?._id : obj;
              const truckId = getId(doc.truck);
              const dateStr = doc.expiry_date ? formatDate(doc.expiry_date) : "No Date";

              return (
                <View
                  key={doc._id}
                  style={{ backgroundColor: colors.secondary }}
                  className="flex-row justify-between items-center p-3 rounded-xl mb-2"
                >
                  <View className="flex-1">
                    <Text style={{ color: colors.secondaryForeground }} className="font-medium text-sm">
                      {doc.document_type} Expiring
                    </Text>
                    <Text className="text-muted-foreground text-[10px] mt-1">
                      Truck: {getTruckName(doc.truck)}
                    </Text>
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
        <View style={{ backgroundColor: colors.card }} className="rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.foreground }} className="font-semibold text-lg">{t('recentTrips')}</Text>
            <TouchableOpacity onPress={() => router.push("/tripLog")}>
              <Text className="text-muted-foreground text-sm">{t('viewAll')} →</Text>
            </TouchableOpacity>
          </View>

          {recentTrips.length > 0 ? (
            visibleRecentTrips.map((trip) => {
              const getId = (obj: any): string =>
                typeof obj === "object" ? obj?._id : obj;
              const tripId = trip?._id;
              const truckId = getId(trip.truck);
              const driverId = getId(trip.driver);
              const dateStr = trip.trip_date
                ? formatDate(trip.trip_date)
                : "No Date";
              const cost = trip.cost_of_trip ?? 0;

              return (
                <View
                  key={tripId}
                  style={{ backgroundColor: colors.secondary }}
                  className="flex-row justify-between items-center p-3 rounded-xl mb-2"
                >
                  <View className="flex-1">
                    <Text style={{ color: colors.secondaryForeground }} className="font-medium text-sm">
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
              style={{ backgroundColor: colors.secondary }}
              className="mt-2 p-2 rounded-lg items-center"
            >
              <Text style={{ color: colors.secondaryForeground }} className="text-xs font-semibold">
                {recentTripsVisibleCount < 10 ? "Load 5 more" : "Show all"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}


