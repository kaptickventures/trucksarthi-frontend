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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";

import SideMenu from "../../../components/SideMenu";

import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";

import TripFilters from "../../../components/FilterSection";

// Enable layout animation on Android
if (
  Platform.OS === "android" &&
  // @ts-ignore
  UIManager.setLayoutAnimationEnabledExperimental
) {
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

  const { trips, loading, totalRevenue } = useTrips(firebase_uid || "");
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
  const [showDatePicker, setShowDatePicker] = useState<{
    field: "startDate" | "endDate" | null;
  }>({ field: null });

  // Helpers
  const getDriverName = (id: number) =>
    drivers.find((d) => d.driver_id === id)?.driver_name || "Unknown Driver";

  const getClientName = (id: number) =>
    clients.find((c) => c.client_id === id)?.client_name || "Unknown Client";

  const getTruckReg = (id: number) =>
    trucks.find((t) => t.truck_id === id)?.registration_number || "Unknown Truck";

  const getLocationName = (id: number) =>
    locations.find((l) => l.location_id === id)?.location_name || "Unknown";

  // Filter + Sort
  const sortedTrips = useMemo(() => {
    let filtered = [...(trips || [])];

    if (filters.driver_id)
      filtered = filtered.filter(
        (t) => String(t.driver_id) === String(filters.driver_id)
      );
    if (filters.client_id)
      filtered = filtered.filter(
        (t) => String(t.client_id) === String(filters.client_id)
      );
    if (filters.startDate)
      filtered = filtered.filter(
        (t) => new Date(t.trip_date) >= filters.startDate!
      );
    if (filters.endDate)
      filtered = filtered.filter(
        (t) => new Date(t.trip_date) <= filters.endDate!
      );

    return filtered.sort(
      (a, b) =>
        new Date(b.trip_date).getTime() - new Date(a.trip_date).getTime()
    );
  }, [trips, filters]);

  const driverItems = drivers.map((d) => ({
    label: d.driver_name,
    value: String(d.driver_id),
  }));

  const clientItems = clients.map((c) => ({
    label: c.client_name,
    value: String(c.client_id),
  }));

  const formatDate = (date: Date | null) =>
    date ? date.toISOString().split("T")[0] : "Select Date";

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  // Header styling
  const backgroundColor = isDark ? "hsl(220 15% 8%)" : "hsl(0 0% 100%)";
  const foregroundColor = isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 4%)";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",

      headerStyle: { backgroundColor },
      headerTitleStyle: { color: foregroundColor, fontWeight: "600" },
      headerTintColor: foregroundColor,

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
            color={foregroundColor}
          />
        </TouchableOpacity>
      ),

      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
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
            color={foregroundColor}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDark, menuVisible, backgroundColor, foregroundColor]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
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
          <Text className="text-lg font-semibold text-foreground">
            {sortedTrips.length} trips found
          </Text>
          <Text className="text-3xl font-extrabold text-primary mt-1">
            ₹{totalRevenue.toLocaleString()}
          </Text>
        </View>

        {/* TRIP CARDS */}
        {loading ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : sortedTrips.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No trips available
          </Text>
        ) : (
          sortedTrips.map((trip: any) => (
            <View
              key={trip.trip_id}
              className="bg-card border border-border rounded-2xl mx-3 mb-5 p-5 shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-muted-foreground">
                  {new Date(trip.trip_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
                <Text className="text-xl font-bold text-primary">
                  ₹{trip.cost_of_trip?.toLocaleString() || 0}
                </Text>
              </View>

              <Text className="text-lg font-semibold text-foreground mb-3">
                {getLocationName(trip.start_location_id)} →{" "}
                {getLocationName(trip.end_location_id)}
              </Text>

              <View className="mb-4 gap-1">
                <Text className="text-foreground mb-1">
                  🏢 {getClientName(trip.client_id)}
                </Text>
                <Text className="text-foreground mb-1">
                  🚚 {getTruckReg(trip.truck_id)}
                </Text>
                <Text className="text-foreground">
                  👤 {getDriverName(trip.driver_id)}
                </Text>
              </View>

              {/* SEPARATOR */}
              <View className="m-2 border-t-2 border border-border opacity-80" />

              <View className="flex-row justify-between mt-2">
                <Text className="text-muted-foreground">
                  Trip Cost: ₹{trip.cost_of_trip.toLocaleString()}
                </Text>
                <Text className="text-muted-foreground">
                  Misc: ₹{trip.miscellaneous_expense.toLocaleString()}
                </Text>
              </View>

              {trip.notes ? (
                <Text className="text-sm text-muted-foreground italic mt-2">
                  📝 {trip.notes}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* Slide-in Menu */}
      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}
