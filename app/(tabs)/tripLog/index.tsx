// app/(tabs)/tripLog/index.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
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


// Enable layout animation on Android
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

  const { trips, loading, totalRevenue, fetchTrips, updateTrip, deleteTrip } = useTrips(firebase_uid || "");
  const { drivers } = useDrivers(firebase_uid || "");
  const { clients } = useClients(firebase_uid || "");
  const { trucks } = useTrucks(firebase_uid || "");
  const { locations } = useLocations(firebase_uid || "");

  const [filters, setFilters] = useState({
    driver_id: "" as string | null,
    client_id: "" as string | null,
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const [dropdowns, setDropdowns] = useState({
    driver: false,
    client: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<{ field: "startDate" | "endDate" | null }>({ field: null });

  // Edit modal state (external component)
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  // Helpers to map ids to names
  const getDriverName = (id: number) => drivers.find((d) => d.driver_id === id)?.driver_name || "Unknown Driver";
  const getClientName = (id: number) => clients.find((c) => c.client_id === id)?.client_name || "Unknown Client";
  const getTruckReg = (id: number) => trucks.find((t) => t.truck_id === id)?.registration_number || "Unknown Truck";
  const getLocationName = (id: number) => locations.find((l) => l.location_id === id)?.location_name || "Unknown";

  // Filter + Sort
  const sortedTrips = useMemo(() => {
    let filtered = [...(trips || [])];

    if (filters.driver_id) filtered = filtered.filter((t) => String(t.driver_id) === String(filters.driver_id));
    if (filters.client_id) filtered = filtered.filter((t) => String(t.client_id) === String(filters.client_id));
    if (filters.startDate) filtered = filtered.filter((t) => new Date(t.trip_date) >= filters.startDate!);
    if (filters.endDate) filtered = filtered.filter((t) => new Date(t.trip_date) <= filters.endDate!);

    return filtered.sort((a, b) => new Date(b.trip_date).getTime() - new Date(a.trip_date).getTime());
  }, [trips, filters]);

  const driverItems = drivers.map((d) => ({ label: d.driver_name, value: String(d.driver_id) }));
  const clientItems = clients.map((c) => ({ label: c.client_name, value: String(c.client_id) }));
  const truckItems = trucks.map((t) => ({ label: t.registration_number, value: String(t.truck_id) }));
  const locationItems = locations.map((l) => ({ label: l.location_name, value: String(l.location_id) }));

  const formatDate = (date: Date | null) => (date ? date.toISOString().split("T")[0] : "Select Date");

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  // Header styling
const backgroundColor = isDark
  ? THEME.dark.background
  : THEME.light.background;

const foregroundColor = isDark
  ? THEME.dark.foreground
  : THEME.light.foreground;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor },
      headerTitleStyle: { color: foregroundColor, fontWeight: "600" },
      headerTintColor: foregroundColor,

      headerLeft: () => (
        <TouchableOpacity onPress={() => setMenuVisible((prev) => !prev)} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          <Ionicons name={menuVisible ? "close" : "menu"} size={24} color={foregroundColor} />
        </TouchableOpacity>
      ),

      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/notifications")} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          <Ionicons name="notifications-outline" size={24} color={foregroundColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDark, menuVisible, backgroundColor, foregroundColor]);

  const openEdit = (trip: any) => {
    // keep the trip object intact (it contains the raw trip_date ISO string)
    setSelectedTrip(trip);
    setEditVisible(true);
  };
  const closeEdit = () => {
    setEditVisible(false);
    setSelectedTrip(null);
  };

  // Save / Delete handlers from modal (payload shape matches AddTrip but includes trip_date raw string)
  const handleSaveFromModal = async (id: number, data: any) => {
    try {
      await updateTrip(id, data); // data includes trip_date as raw ISO string
      await fetchTrips();
      closeEdit();
      Alert.alert("Success", "Trip updated");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to update trip");
    }
  };

  const handleDeleteFromModal = async (id: number) => {
    try {
      await deleteTrip(id);
      await fetchTrips();
      closeEdit();
      Alert.alert("Success", "Trip deleted");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to delete trip");
    }
  };

  // Inline card delete (keeps existing confirm flow)
  const confirmDelete = (tripId: number) => {
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTrip(tripId);
            await fetchTrips();
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to delete trip");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* FILTERS COMPONENT */}
        <TripFilters
          filters={filters}
          setFilters={setFilters}
          dropdowns={dropdowns}
          setDropdowns={setDropdowns}
          driverItems={driverItems}
          clientItems={clientItems}
          showFilters={showFilters}
          toggleFilters={toggleFilters}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          formatDate={formatDate}
        />

        {/* SUMMARY */}
        <View className="mx-3 mt-2 mb-6 bg-card border border-border p-4 rounded-2xl shadow-sm">
          <Text className="text-lg font-semibold text-foreground">{sortedTrips.length} trips found</Text>
          <Text className="text-3xl font-extrabold text-primary mt-1">₹{totalRevenue.toLocaleString()}</Text>
        </View>

        {/* TRIP CARDS */}
        {loading ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : sortedTrips.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No trips available</Text>
        ) : (
          sortedTrips.map((trip: any) => (
            <View key={trip.trip_id} className="bg-card border border-border rounded-2xl mx-3 mb-5 p-5 shadow-sm">
              {/* Top row: date, actions, cost */}
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-muted-foreground">
                  {new Date(trip.trip_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Text>

                <View className="flex-row items-center">
                  <TouchableOpacity onPress={() => openEdit(trip)} className="p-2 mr-2">
                    <Edit3 size={20} color="#2563EB" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => confirmDelete(trip.trip_id)} className="p-2 mr-3">
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>

                  <Text className="text-xl font-bold text-primary">₹{trip.cost_of_trip?.toLocaleString() || 0}</Text>
                </View>
              </View>

              <Text className="text-lg font-semibold text-foreground mb-3">
                {getLocationName(trip.start_location_id)} → {getLocationName(trip.end_location_id)}
              </Text>

              <View className="mb-4 gap-1">
                <Text className="text-foreground mb-1">🏢 {getClientName(trip.client_id)}</Text>
                <Text className="text-foreground mb-1">🚚 {getTruckReg(trip.truck_id)}</Text>
                <Text className="text-foreground">👤 {getDriverName(trip.driver_id)}</Text>
              </View>

              <View className="m-2 border-t-2 border border-border opacity-80" />

              <View className="flex-row justify-between mt-2">
                <Text className="text-muted-foreground">Trip Cost: ₹{trip.cost_of_trip.toLocaleString()}</Text>
                <Text className="text-muted-foreground">Misc: ₹{trip.miscellaneous_expense.toLocaleString()}</Text>
              </View>

              {trip.notes ? <Text className="text-sm text-muted-foreground italic mt-2">📝 {trip.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* Slide-in Menu */}
      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Edit modal component (sends trip_date raw ISO string back) */}
      <EditTripModal visible={isEditVisible} onClose={closeEdit} trip={selectedTrip} trucks={trucks} drivers={drivers} clients={clients} locations={locations} onSave={handleSaveFromModal} onDelete={handleDeleteFromModal} />
    </SafeAreaView>
  );
}
