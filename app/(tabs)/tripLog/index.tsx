
import { useEffect, useLayoutEffect, useMemo, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { NotificationBadge } from "../../../components/NotificationBadge";
import SideMenu from "../../../components/SideMenu";

import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";
import { useThemeStore } from "../../../hooks/useThemeStore";

import TripFilters from "../../../components/FilterSection";

import { Edit3, Trash2 } from "lucide-react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDate } from "../../../lib/utils";
import { useTranslation } from "../../../context/LanguageContext";


if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  // @ts-ignore
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TripLog() {
  const router = useRouter();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
    }, [])
  );
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();

  const isDark = theme === "dark";

  const {
    trips,
    loading: tripsLoading,
    fetchTrips,
    deleteTrip,
  } = useTrips();

  const {
    drivers,
    fetchDrivers,
  } = useDrivers();

  const {
    clients,
    fetchClients,
  } = useClients();

  const {
    trucks,
    fetchTrucks,
  } = useTrucks();

  const {
    locations,
    fetchLocations,
  } = useLocations();

  useEffect(() => {
    fetchTrips();
    fetchDrivers();
    fetchClients();
    fetchTrucks();
    fetchLocations();
  }, [fetchTrips, fetchDrivers, fetchClients, fetchTrucks, fetchLocations]);

  // FILTER STATE
  const [filters, setFilters] = useState({
    driver: [] as string[],
    client: [] as string[],
    truck: [] as string[],
    location: [] as string[],
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const [dropdowns, setDropdowns] = useState({
    driver: false,
    client: false,
    truck: false,
    location: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<{
    field: "startDate" | "endDate" | null;
  }>({ field: null });

  // Helper functions
  const getId = (obj: any): string => (typeof obj === "object" ? obj?._id : obj);

  const getDriverName = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = drivers.find((v) => String(v._id) === sId);
    if (found) return found.driver_name || found.name || "N/A";
    if (typeof idOrObj === "object") return idOrObj.driver_name || idOrObj.name || "N/A";
    return sId.slice(-6) || "N/A";
  };

  const getClientName = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = clients.find((c) => String(c._id) === sId);
    if (found) return found.client_name || "N/A";
    if (typeof idOrObj === "object") return idOrObj.client_name || "N/A";
    return sId.slice(-6) || "N/A";
  };

  const getTruckReg = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = trucks.find((t) => String(t._id) === sId);
    if (found) return found.registration_number || "N/A";
    if (typeof idOrObj === "object") return idOrObj.registration_number || "N/A";
    return sId.slice(-6) || "N/A";
  };

  const getLocationName = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = locations.find((l) => String(l._id) === sId);
    if (found) return found.location_name || "N/A";
    if (typeof idOrObj === "object") return idOrObj.location_name || "N/A";
    return sId.slice(-6) || "N/A";
  };

	  const sortedTrips = useMemo(() => {
	    let filtered = [...(trips || [])];

    if (filters.driver.length)
      filtered = filtered.filter((t) => filters.driver.includes(getId(t.driver)));

    if (filters.client.length)
      filtered = filtered.filter((t) => filters.client.includes(getId(t.client)));

    if (filters.truck.length)
      filtered = filtered.filter((t) => filters.truck.includes(getId(t.truck)));

    if (filters.location.length)
      filtered = filtered.filter(
        (t) =>
          filters.location.includes(getId(t.start_location)) ||
          filters.location.includes(getId(t.end_location))
      );

	    const start = filters.startDate ? new Date(filters.startDate) : null;
	    if (start) start.setHours(0, 0, 0, 0);
	    if (start) filtered = filtered.filter((t) => t.trip_date && new Date(t.trip_date) >= start);

	    const end = filters.endDate ? new Date(filters.endDate) : null;
	    if (end) end.setHours(23, 59, 59, 999);
	    if (end) filtered = filtered.filter((t) => t.trip_date && new Date(t.trip_date) <= end);

    return filtered.sort(
      (a, b) => {
        const da = a.trip_date ? new Date(a.trip_date).getTime() : 0;
        const db = b.trip_date ? new Date(b.trip_date).getTime() : 0;
        return db - da;
      }
    );
  }, [trips, filters]);

  const driverItems = drivers.map((d) => ({
    label: d.driver_name,
    value: d._id,
  }));
  const clientItems = clients.map((c) => ({
    label: c.client_name,
    value: c._id,
  }));
  const truckItems = trucks.map((t) => ({
    label: t.registration_number,
    value: t._id,
  }));
  const locationItems = locations.map((l) => ({
    label: l.location_name,
    value: l._id,
  }));

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  const generatePDF = async () => {
    try {
      const fmt = (d: Date | null) => formatDate(d);
      const totalCost = sortedTrips.reduce((sum, t) => sum + Number(t.cost_of_trip || 0), 0);
      const totalMisc = sortedTrips.reduce((sum, t) => sum + Number(t.miscellaneous_expense || 0), 0);
      const totalRevenue = totalCost + totalMisc;

      let dateRangeText = "";

      if (filters.startDate && filters.endDate) {
        dateRangeText = `Date Range: ${fmt(filters.startDate)} -> ${fmt(filters.endDate)}`;
      } else if (filters.startDate) {
        dateRangeText = `Date Range: From ${fmt(filters.startDate)}`;
      } else if (filters.endDate) {
        dateRangeText = `Date Range: Until ${fmt(filters.endDate)}`;
      }

      const driverFilters = filters.driver.map((id) => getDriverName(id)).filter(Boolean);
      const clientFilters = filters.client.map((id) => getClientName(id)).filter(Boolean);
      const truckFilters = filters.truck.map((id) => getTruckReg(id)).filter(Boolean);
      const locationFilters = filters.location.map((id) => getLocationName(id)).filter(Boolean);
      const hasFilters = driverFilters.length || clientFilters.length || truckFilters.length || locationFilters.length;

      const html = `
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 30px;
      color: #000;
    }
    .title { text-align: center; font-size: 28px; font-weight: 800; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 13px; opacity: 0.7; margin-bottom: 12px; }
    .divider { height: 2px; background: #000; margin: 18px 0 22px 0; }
    .section-title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 6px; }
    .generated { text-align: center; font-size: 12px; opacity: 0.65; margin-bottom: 10px; }
    .daterange { text-align: center; font-size: 13px; opacity: 0.75; margin-bottom: 18px; }
    .filters { text-align: center; font-size: 12px; opacity: 0.8; margin-bottom: 18px; }
    .card { border: 1px solid #000; border-radius: 10px; padding: 14px; margin-bottom: 22px; }
    .card-top { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; margin-bottom: 10px; }
    .route { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
    .meta-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
    .meta-col { flex: 1; }
    .label { font-size: 11px; opacity: 0.6; }
    .value { font-size: 13px; font-weight: 600; margin-top: 4px; }
    .cost-row { display: flex; justify-content: space-between; margin-top: 12px; border-top: 1px solid #000; padding-top: 10px; font-size: 13px; }
    .notes { margin-top: 10px; font-size: 13px; font-style: italic; opacity: 0.8; }
    .summary { border: 2px solid #000; border-radius: 10px; padding: 14px; margin-top: 18px; }
    .summary-title { font-size: 14px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .summary-row:last-child { margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="title">Trucksarthi</div>  <div class="divider"></div>
  <div class="section-title">Trip Report</div>
  <div class="generated">Generated on ${formatDate(new Date())}</div>
  ${dateRangeText ? `<div class="daterange">${dateRangeText}</div>` : ""}
  ${hasFilters ? `<div class="filters">
    ${driverFilters.length ? `Drivers: ${driverFilters.join(", ")}` : ""}
    ${clientFilters.length ? `${driverFilters.length ? " | " : ""}Clients: ${clientFilters.join(", ")}` : ""}
    ${truckFilters.length ? `${driverFilters.length || clientFilters.length ? " | " : ""}Trucks: ${truckFilters.join(", ")}` : ""}
    ${locationFilters.length ? `${driverFilters.length || clientFilters.length || truckFilters.length ? " | " : ""}Locations: ${locationFilters.join(", ")}` : ""}
  </div>` : ""}
  ${sortedTrips
          .map((t) => {
            const total = Number(t.cost_of_trip) + Number(t.miscellaneous_expense);
            return `
    <div class="card">
      <div class="card-top">
        <div>${t.trip_date ? fmt(new Date(t.trip_date)) : "No Date"}</div>
        <div>₹ ${total.toLocaleString()}</div>
      </div>
      <div class="route">Route: ${getLocationName(t.start_location)} -> ${getLocationName(t.end_location)}</div>
      <div class="meta-row">
        <div class="meta-col"><div class="label">TRUCK</div><div class="value">${getTruckReg(
              t.truck
            )}</div></div>
        <div class="meta-col"><div class="label">DRIVER</div><div class="value">${getDriverName(
              t.driver
            )}</div></div>
        <div class="meta-col"><div class="label">CLIENT</div><div class="value">${getClientName(
              t.client
            )}</div></div>
      </div>
      <div class="cost-row">
        <div><div class="label">TRIP COST</div><div class="value">₹ ${Number(t.cost_of_trip).toLocaleString()}</div></div>
        <div><div class="label">MISC EXPENSE</div><div class="value">₹ ${Number(t.miscellaneous_expense).toLocaleString()}</div></div>
      </div>
      ${t.notes ? `<div class="notes">Notes: ${t.notes}</div>` : ""}
    </div>
  `;
          })
          .join("")}
  <div class="summary">
    <div class="summary-title">Totals</div>
    <div class="summary-row"><div>Total Cost</div><div>₹ ${totalCost.toLocaleString()}</div></div>
    <div class="summary-row"><div>Misc Cost</div><div>₹ ${totalMisc.toLocaleString()}</div></div>
    <div class="summary-row"><div>Total Revenue</div><div>₹ ${totalRevenue.toLocaleString()}</div></div>
  </div>
</body>
</html>
`;
      const { uri } = await Print.printToFileAsync({ html });
      const newUri = `${FileSystem.documentDirectory}TripHistory.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newUri });
      await Sharing.shareAsync(newUri);
    } catch (err) {
      console.log(err);
      Alert.alert(t("error"), "PDF creation failed.");
    }
  };

  const foregroundColor = colors.foreground;

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
      headerTitleStyle: { color: colors.foreground, fontWeight: "800", fontSize: 22 },
      headerTintColor: colors.foreground,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Ionicons name={menuVisible ? "close" : "menu"} size={24} color={foregroundColor} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/(stack)/notifications" as any)}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <NotificationBadge size={24} color={foregroundColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, menuVisible, foregroundColor, colors.background, colors.border, colors.foreground, isDark, router]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTrips(),
      fetchDrivers(),
      fetchClients(),
      fetchTrucks(),
      fetchLocations(),
    ]);
    setRefreshing(false);
  };

  const formatDateLocal = (d: Date | null) => d ? formatDate(d) : "Select Date";

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-background" style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('tripLog')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t("trackManageHistory")}</Text>
        </View>

        <View style={{ marginTop: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity
            onPress={toggleFilters}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: colors.successSoft,
              shadowColor: colors.shadow,
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2
            }}
          >
            <Ionicons name="filter" size={18} color={colors.success} />
            <Text style={{ marginLeft: 8, fontWeight: "600", color: colors.success }}>{t("filters")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={generatePDF}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: colors.infoSoft,
              shadowColor: colors.shadow,
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2
            }}
          >
            <Ionicons name="download-outline" size={18} color={colors.info} />
            <Text style={{ marginLeft: 8, fontWeight: "600", color: colors.info }}>{t("pdf")}</Text>
          </TouchableOpacity>
        </View >

        <TripFilters
          filters={filters}
          setFilters={setFilters}
          dropdowns={dropdowns}
          setDropdowns={setDropdowns}
          driverItems={driverItems}
          clientItems={clientItems}
          truckItems={truckItems}
          locationItems={locationItems}
          showFilters={showFilters}
          toggleFilters={toggleFilters}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          formatDate={formatDateLocal}
        />

        <View
          className="mt-1 mb-6 p-4 rounded-2xl border"
          style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              {sortedTrips.length} trips
            </Text>
            <Text className="text-3xl font-extrabold" style={{ color: colors.primary }}> ₹ {sortedTrips.reduce((acc, t) => acc + Number(t.cost_of_trip) + Number(t.miscellaneous_expense), 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {
          tripsLoading ? (
            <ActivityIndicator size="large" className="mt-10" />
          ) : sortedTrips.length === 0 ? (
            <Text className="text-center text-muted-foreground mt-10" style={{ color: colors.mutedForeground }}>{t('noTripsFound')}</Text>
          ) : (
            sortedTrips.map((trip) => {
              const totalCost = Number(trip.cost_of_trip) + Number(trip.miscellaneous_expense);
              return (
                <View key={trip._id} style={{ marginBottom: 12 }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "/(stack)/trip-detail", params: { tripId: trip._id } } as any)}
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{trip.trip_date ? formatDate(trip.trip_date) : t("noDate")}</Text>
                      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>{`₹ ${totalCost.toLocaleString()}`}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                      {getLocationName(trip.start_location)}
                      {" -> "}
                      {getLocationName(trip.end_location)}
                    </Text>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: colors.foreground, marginBottom: 2, fontSize: 12 }}>Client: {getClientName(trip.client)}</Text>
                      <Text style={{ color: colors.foreground, marginBottom: 2, fontSize: 12 }}>Truck: {getTruckReg(trip.truck)}</Text>
                      <Text style={{ color: colors.foreground, fontSize: 12 }}>Driver: {getDriverName(trip.driver)}</Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, opacity: 0.6, marginVertical: 8 }} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Trip Cost: ₹ {Number(trip.cost_of_trip).toLocaleString()}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Misc: ₹ {Number(trip.miscellaneous_expense).toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        {trip.notes ? (
                          <Text
                            style={{ fontStyle: "italic", color: colors.mutedForeground, fontSize: 11 }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            Notes: {trip.notes}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: "row", marginLeft: 6 }}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            router.push({ pathname: "/(stack)/edit-trip", params: { tripId: String(trip._id) } } as any);
                          }}
                          style={{ padding: 6, marginRight: 4 }}
                        >
                          <Edit3 size={18} color={colors.info} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            Alert.alert(t("delete"), t("deleteTripQuestion"), [
                              { text: t("cancel"), style: "cancel" },
                              {
                                text: t("delete"),
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await deleteTrip(trip._id);
                                    await fetchTrips();
                                  } catch { }
                                },
                              },
                            ]);
                          }}
                          style={{ padding: 6 }}
                        >
                          <Trash2 size={18} color={colors.destructive} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )
        }
      </ScrollView >
      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView >
  );
}

