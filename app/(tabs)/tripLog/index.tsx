// app/(tabs)/tripLog/index.tsx
import { getAuth } from "firebase/auth";
import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  useColorScheme,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";

import SideMenu from "../../../components/SideMenu";
import EditTripModal from "../../../components/EditTripModal";

import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";

import TripFilters from "../../../components/FilterSection";

import { Edit3, Trash2 } from "lucide-react-native";
import { THEME } from "../../../theme";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy"; // legacy FS for stability

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

  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { trips, loading, fetchTrips, updateTrip, deleteTrip } =
    useTrips(firebase_uid || "");
  const { drivers } = useDrivers(firebase_uid || "");
  const { clients } = useClients(firebase_uid || "");
  const { trucks } = useTrucks(firebase_uid || "");
  const { locations } = useLocations(firebase_uid || "");

  // FILTER STATE
  const [filters, setFilters] = useState({
    driver_id: "" as string | null,
    client_id: "" as string | null,
    truck_id: "" as string | null,
    location_id: "" as string | null,
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
  const getDriverName = (id: number) =>
    drivers.find((d) => d.driver_id === id)?.driver_name || "Unknown Driver";

  const getClientName = (id: number) =>
    clients.find((c) => c.client_id === id)?.client_name || "Unknown Client";

  const getTruckReg = (id: number) =>
    trucks.find((t) => t.truck_id === id)?.registration_number || "Unknown Truck";

  const getLocationName = (id: number) =>
    locations.find((l) => l.location_id === id)?.location_name || "Unknown";

  // FILTER + SORT
  const sortedTrips = useMemo(() => {
    let filtered = [...(trips || [])];

    if (filters.driver_id)
      filtered = filtered.filter((t) => String(t.driver_id) === filters.driver_id);

    if (filters.client_id)
      filtered = filtered.filter((t) => String(t.client_id) === filters.client_id);

    if (filters.truck_id)
      filtered = filtered.filter((t) => String(t.truck_id) === filters.truck_id);

    if (filters.location_id)
      filtered = filtered.filter(
        (t) =>
          String(t.start_location_id) === filters.location_id ||
          String(t.end_location_id) === filters.location_id
      );

    if (filters.startDate)
      filtered = filtered.filter((t) => new Date(t.trip_date) >= filters.startDate!);

    if (filters.endDate)
      filtered = filtered.filter((t) => new Date(t.trip_date) <= filters.endDate!);

    return filtered.sort(
      (a, b) => new Date(b.trip_date).getTime() - new Date(a.trip_date).getTime()
    );
  }, [trips, filters]);

  const driverItems = drivers.map((d) => ({ label: d.driver_name, value: String(d.driver_id) }));
  const clientItems = clients.map((c) => ({ label: c.client_name, value: String(c.client_id) }));
  const truckItems = trucks.map((t) => ({ label: t.registration_number, value: String(t.truck_id) }));
  const locationItems = locations.map((l) => ({ label: l.location_name, value: String(l.location_id) }));

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  // ===========================
  // PDF generator (legacy FS) with date-range support
  // ===========================
  const generatePDF = async () => {
    try {
      // ---------- DATE RANGE HANDLING ----------
      const fmt = (d: Date | null) =>
        d
          ? d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : null;

      let dateRangeText = "";

      if (filters.startDate && filters.endDate) {
        dateRangeText = `Date Range: ${fmt(filters.startDate)} → ${fmt(filters.endDate)}`;
      } else if (filters.startDate) {
        dateRangeText = `Date Range: From ${fmt(filters.startDate)}`;
      } else if (filters.endDate) {
        dateRangeText = `Date Range: Until ${fmt(filters.endDate)}`;
      }

      // ---------- HTML PDF TEMPLATE (black & white) ----------
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

      .title {
        text-align: center;
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 4px;
      }

      .subtitle {
        text-align: center;
        font-size: 13px;
        opacity: 0.7;
        margin-bottom: 12px;
      }

      .divider {
        height: 2px;
        background: #000;
        margin: 18px 0 22px 0;
      }

      .section-title {
        text-align: center;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 6px;
      }

      .generated {
        text-align: center;
        font-size: 12px;
        opacity: 0.65;
        margin-bottom: 10px;
      }

      .daterange {
        text-align: center;
        font-size: 13px;
        opacity: 0.75;
        margin-bottom: 18px;
      }

      .card {
        border: 1px solid #000;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 22px;
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .route {
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 13px;
      }

      .meta-col {
        flex: 1;
      }

      .label {
        font-size: 11px;
        opacity: 0.6;
      }

      .value {
        font-size: 13px;
        font-weight: 600;
        margin-top: 4px;
      }

      .cost-row {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        border-top: 1px solid #000;
        padding-top: 10px;
        font-size: 13px;
      }

      .notes {
        margin-top: 10px;
        font-size: 13px;
        font-style: italic;
        opacity: 0.8;
      }
    </style>
  </head>

  <body>
    <div class="title">Truck Sarthi</div>
    <div class="subtitle">By Kaptick Labs</div>

    <div class="divider"></div>

    <div class="section-title">Trip Report</div>
    <div class="generated">Generated on ${new Date().toLocaleString("en-IN")}</div>

    ${dateRangeText ? `<div class="daterange">${dateRangeText}</div>` : ""}

    ${sortedTrips
      .map((t) => {
        const total = Number(t.cost_of_trip) + Number(t.miscellaneous_expense);
        return `
        <div class="card">
          <div class="card-top">
            <div>${fmt(new Date(t.trip_date))}</div>
            <div>₹${total.toLocaleString()}</div>
          </div>

          <div class="route">Route: ${getLocationName(t.start_location_id)} → ${getLocationName(
          t.end_location_id
        )}</div>

          <div class="meta-row">
            <div class="meta-col">
              <div class="label">TRUCK</div>
              <div class="value">${getTruckReg(t.truck_id)}</div>
            </div>

            <div class="meta-col">
              <div class="label">DRIVER</div>
              <div class="value">${getDriverName(t.driver_id)}</div>
            </div>

            <div class="meta-col">
              <div class="label">CLIENT</div>
              <div class="value">${getClientName(t.client_id)}</div>
            </div>
          </div>

          <div class="cost-row">
            <div>
              <div class="label">TRIP COST</div>
              <div class="value">₹${Number(t.cost_of_trip).toLocaleString()}</div>
            </div>

            <div>
              <div class="label">MISC EXPENSE</div>
              <div class="value">₹${Number(t.miscellaneous_expense).toLocaleString()}</div>
            </div>
          </div>

          ${t.notes ? `<div class="notes">Notes: ${t.notes}</div>` : ""}
        </div>
      `;
      })
      .join("")}
  </body>
</html>
`;

      // generate file
      const { uri } = await Print.printToFileAsync({ html });

      const newUri = `${FileSystem.documentDirectory}TripHistory.pdf`;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      await Sharing.shareAsync(newUri);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "PDF creation failed.");
    }
  };

  // Header styling
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

  const formatDate = (d: Date | null) =>
    d ? d.toISOString().split("T")[0] : "Select Date";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* FILTERS */}
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
          formatDate={formatDate}
        />

        {/* ACTION BUTTONS (WhatsApp-like pills) */}
        {/* ACTION BUTTONS (WhatsApp-like pills) */}
<View
  style={{
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  {/* Filters pill */}
  <TouchableOpacity
    onPress={toggleFilters}
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,

      backgroundColor: isDark ? "#0A3325" : "#E7FCEB", // 🌙 dark vs light
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    }}
  >
    <Ionicons
      name="filter"
      size={18}
      color={isDark ? "#4ADE80" : "#25D366"} // 🌙 mint green vs light green
    />
    <Text
      style={{
        marginLeft: 8,
        fontWeight: "600",
        color: isDark ? "#86EFAC" : "#128C7E",
      }}
    >
      Filters
    </Text>
  </TouchableOpacity>

  {/* PDF pill */}
  <TouchableOpacity
    onPress={generatePDF}
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,

      backgroundColor: isDark ? "#111B3C" : "#E8F0FE", // 🌙 dark navy vs light blue
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    }}
  >
    <Ionicons
      name="download-outline"
      size={18}
      color={isDark ? "#93C5FD" : "#2563EB"} // 🌙 soft blue vs normal blue
    />
    <Text
      style={{
        marginLeft: 8,
        fontWeight: "600",
        color: isDark ? "#BFDBFE" : "#1D4ED8",
      }}
    >
      PDF
    </Text>
  </TouchableOpacity>
</View>


        {/* SUMMARY */}
        <View className="mx-3 mt-1 mb-6 bg-card border border-border p-4 rounded-2xl shadow-sm">
          <Text className="text-lg font-semibold text-foreground">
            {sortedTrips.length} trips found
          </Text>

          <Text className="text-3xl font-extrabold text-primary mt-1">
            ₹
            {sortedTrips.reduce(
              (acc, t) => acc + Number(t.cost_of_trip) + Number(t.miscellaneous_expense),
              0
            ).toLocaleString()}
          </Text>
        </View>

        {/* TRIP CARDS */}
        {loading ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : sortedTrips.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No trips available</Text>
        ) : (
          sortedTrips.map((trip) => {
            const totalCost = Number(trip.cost_of_trip) + Number(trip.miscellaneous_expense);

            return (
              <View key={trip.trip_id} style={{ marginHorizontal: 12, marginBottom: 20 }}>
                <View className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>{new Date(trip.trip_date).toLocaleDateString("en-IN")}</Text>
                    <Text style={{ fontSize: 22, fontWeight: "800", color: THEME.light.primary }}>{`₹${totalCost.toLocaleString()}`}</Text>
                  </View>

                  <Text style={{ fontSize: 18, fontWeight: "700", color: isDark ? THEME.dark.foreground : THEME.light.foreground, marginBottom: 10 }}>
                    {getLocationName(trip.start_location_id)} → {getLocationName(trip.end_location_id)}
                  </Text>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground, marginBottom: 4 }}>🏢 {getClientName(trip.client_id)}</Text>
                    <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground, marginBottom: 4 }}>🚚 {getTruckReg(trip.truck_id)}</Text>
                    <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground }}>👤 {getDriverName(trip.driver_id)}</Text>
                  </View>

                  <View style={{ borderTopWidth: 1, borderTopColor: isDark ? THEME.dark.border : THEME.light.border, opacity: 0.6, marginVertical: 12 }} />

                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>Trip Cost: ₹{Number(trip.cost_of_trip).toLocaleString()}</Text>
                    <Text style={{ color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>Misc: ₹{Number(trip.miscellaneous_expense).toLocaleString()}</Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    {trip.notes ? (
                      <Text style={{ fontStyle: "italic", color: isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground }}>📝 {trip.notes}</Text>
                    ) : <View />}

                    <View style={{ flexDirection: "row" }}>
                      <TouchableOpacity onPress={() => { setSelectedTrip(trip); setEditVisible(true); }} style={{ padding: 8, marginRight: 8 }}>
                        <Edit3 size={22} color="#2563EB" />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => {
                        Alert.alert("Delete", "Delete this trip?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              await deleteTrip(trip.trip_id);
                              fetchTrips();
                            },
                          },
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
        onSave={async (id, data) => {
          await updateTrip(id, data);
          fetchTrips();
        }}
        onDelete={async (id) => {
          await deleteTrip(id);
          fetchTrips();
        }}
      />
    </SafeAreaView>
  );
}
