// app/(tabs)/tripLog/index.tsx
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
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
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";

import EditTripModal from "../../../components/EditTripModal";
import SideMenu from "../../../components/SideMenu";

import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";
import { useUser } from "../../../hooks/useUser";

import TripFilters from "../../../components/FilterSection";

import { Edit3, Trash2 } from "lucide-react-native";
import { THEME } from "../../../theme";

import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDate } from "../../../lib/utils";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  // @ts-ignore
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TripLog() {
  const router = useRouter();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user } = useUser();

  const {
    trips,
    loading: tripsLoading,
    fetchTrips,
    updateTrip,
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
  }, []);

  // FILTER STATE
  const [filters, setFilters] = useState({
    driver: "" as string | null,
    client: "" as string | null,
    truck: "" as string | null,
    location: "" as string | null,
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

  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  // Helper functions
  const getId = (obj: any): string => (typeof obj === "object" ? obj?._id : obj);

  const getDriverName = (idOrObj: any) => {
    const id = getId(idOrObj);
    return drivers.find((d) => d._id === id)?.driver_name || "Unknown Driver";
  };

  const getClientName = (idOrObj: any) => {
    const id = getId(idOrObj);
    return clients.find((c) => c._id === id)?.client_name || "Unknown Client";
  };

  const getTruckReg = (idOrObj: any) => {
    const id = getId(idOrObj);
    return (
      trucks.find((t) => t._id === id)?.registration_number || "Unknown Truck"
    );
  };

  const getLocationName = (idOrObj: any) => {
    const id = getId(idOrObj);
    return locations.find((l) => l._id === id)?.location_name || "Unknown";
  };

  const sortedTrips = useMemo(() => {
    let filtered = [...(trips || [])];

    if (filters.driver)
      filtered = filtered.filter((t) => getId(t.driver) === filters.driver);

    if (filters.client)
      filtered = filtered.filter((t) => getId(t.client) === filters.client);

    if (filters.truck)
      filtered = filtered.filter((t) => getId(t.truck) === filters.truck);

    if (filters.location)
      filtered = filtered.filter(
        (t) =>
          getId(t.start_location) === filters.location ||
          getId(t.end_location) === filters.location
      );

    if (filters.startDate)
      filtered = filtered.filter((t) => t.trip_date && new Date(t.trip_date) >= filters.startDate!);

    if (filters.endDate)
      filtered = filtered.filter((t) => t.trip_date && new Date(t.trip_date) <= filters.endDate!);

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

      let dateRangeText = "";

      if (filters.startDate && filters.endDate) {
        dateRangeText = `Date Range: ${fmt(filters.startDate)} → ${fmt(filters.endDate)}`;
      } else if (filters.startDate) {
        dateRangeText = `Date Range: From ${fmt(filters.startDate)}`;
      } else if (filters.endDate) {
        dateRangeText = `Date Range: Until ${fmt(filters.endDate)}`;
      }

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
      .card { border: 1px solid #000; border-radius: 10px; padding: 14px; margin-bottom: 22px; }
      .card-top { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; margin-bottom: 10px; }
      .route { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
      .meta-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
      .meta-col { flex: 1; }
      .label { font-size: 11px; opacity: 0.6; }
      .value { font-size: 13px; font-weight: 600; margin-top: 4px; }
      .cost-row { display: flex; justify-content: space-between; margin-top: 12px; border-top: 1px solid #000; padding-top: 10px; font-size: 13px; }
      .notes { margin-top: 10px; font-size: 13px; font-style: italic; opacity: 0.8; }
    </style>
  </head>
  <body>
    <div class="title">Truck Sarthi</div>
    <div class="subtitle">By Kaptick Labs</div>
    <div class="divider"></div>
    <div class="section-title">Trip Report</div>
    <div class="generated">Generated on ${formatDate(new Date())}</div>
    ${dateRangeText ? `<div class="daterange">${dateRangeText}</div>` : ""}
    ${sortedTrips
          .map((t) => {
            const total = Number(t.cost_of_trip) + Number(t.miscellaneous_expense);
            return `
        <div class="card">
          <div class="card-top">
            <div>${t.trip_date ? fmt(new Date(t.trip_date)) : "No Date"}</div>
            <div>₹${total.toLocaleString()}</div>
          </div>
          <div class="route">Route: ${getLocationName(t.start_location)} → ${getLocationName(t.end_location)}</div>
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
            <div><div class="label">TRIP COST</div><div class="value">₹${Number(t.cost_of_trip).toLocaleString()}</div></div>
            <div><div class="label">MISC EXPENSE</div><div class="value">₹${Number(t.miscellaneous_expense).toLocaleString()}</div></div>
          </div>
          ${t.notes ? `<div class="notes">Notes: ${t.notes}</div>` : ""}
        </div>
      `;
          })
          .join("")}
  </body>
</html>
`;
      const { uri } = await Print.printToFileAsync({ html });
      const newUri = `${FileSystem.documentDirectory}TripHistory.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newUri });
      await Sharing.shareAsync(newUri);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "PDF creation failed.");
    }
  };

  const backgroundColor = isDark ? THEME.dark.background : THEME.light.background;
  const foregroundColor = isDark ? THEME.dark.foreground : THEME.light.foreground;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor },
      headerTitleStyle: { color: foregroundColor },
      headerTintColor: foregroundColor,
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
          onPress={() => router.push("/notifications")}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Ionicons name="notifications-outline" size={24} color={foregroundColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDark, menuVisible]);

  const formatDateLocal = (d: Date | null) => d ? formatDate(d) : "Select Date";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
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

        <View style={{ marginHorizontal: 12, marginTop: 8, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity
            onPress={toggleFilters}
            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: isDark ? "#0A3325" : "#E7FCEB", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
          >
            <Ionicons name="filter" size={18} color={isDark ? "#4ADE80" : "#25D366"} />
            <Text style={{ marginLeft: 8, fontWeight: "600", color: isDark ? "#86EFAC" : "#128C7E" }}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={generatePDF}
            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: isDark ? "#111B3C" : "#E8F0FE", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
          >
            <Ionicons name="download-outline" size={18} color={isDark ? "#93C5FD" : "#2563EB"} />
            <Text style={{ marginLeft: 8, fontWeight: "600", color: isDark ? "#BFDBFE" : "#1D4ED8" }}>PDF</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-3 mt-1 mb-6 bg-card border border-border p-4 rounded-2xl shadow-sm">
          <Text className="text-lg font-semibold text-foreground">{sortedTrips.length} trips found</Text>
          <Text className="text-3xl font-extrabold text-primary mt-1">₹{sortedTrips.reduce((acc, t) => acc + Number(t.cost_of_trip) + Number(t.miscellaneous_expense), 0).toLocaleString()}</Text>
        </View>

        {tripsLoading ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : sortedTrips.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No trips available</Text>
        ) : (
          sortedTrips.map((trip) => {
            const totalCost = Number(trip.cost_of_trip) + Number(trip.miscellaneous_expense);
            return (
              <View key={trip._id} style={{ marginHorizontal: 12, marginBottom: 20 }}>
                <View className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>{trip.trip_date ? formatDate(trip.trip_date) : "No Date"}</Text>
                    <Text style={{ fontSize: 22, fontWeight: "800", color: THEME.light.primary }}>{`₹${totalCost.toLocaleString()}`}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: isDark ? THEME.dark.foreground : THEME.light.foreground, marginBottom: 10 }}>{getLocationName(trip.start_location)} → {getLocationName(trip.end_location)}</Text>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground, marginBottom: 4 }}>🏢 {getClientName(trip.client)}</Text>
                    <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground, marginBottom: 4 }}>🚚 {getTruckReg(trip.truck)}</Text>
                    <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground }}>👤 {getDriverName(trip.driver)}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: isDark ? THEME.dark.border : THEME.light.border, opacity: 0.6, marginVertical: 12 }} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>Trip Cost: ₹{Number(trip.cost_of_trip).toLocaleString()}</Text>
                    <Text style={{ color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>Misc: ₹{Number(trip.miscellaneous_expense).toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    {trip.notes ? <Text style={{ fontStyle: "italic", color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>📝 {trip.notes}</Text> : <View />}
                    <View style={{ flexDirection: "row" }}>
                      <TouchableOpacity onPress={() => { setSelectedTrip(trip); setEditVisible(true); }} style={{ padding: 8, marginRight: 8 }}>
                        <Edit3 size={22} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        Alert.alert("Delete", "Delete this trip?", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: async () => { await deleteTrip(trip._id); fetchTrips(); } },
                        ]);
                      }} style={{ padding: 8 }}>
                        <Trash2 size={22} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      <EditTripModal
        visible={isEditVisible}
        onClose={() => setEditVisible(false)}
        trip={selectedTrip}
        trucks={trucks}
        drivers={drivers}
        clients={clients}
        locations={locations}
        onSave={async (id, data) => { await updateTrip(id, data); fetchTrips(); }}
        onDelete={async (id) => { await deleteTrip(id); fetchTrips(); }}
      />
    </SafeAreaView>
  );
}
