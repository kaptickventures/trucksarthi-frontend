import DateTimePicker from "@react-native-community/datetimepicker";
import { getAuth } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import useClients from "../../hooks/useClient";
import useDrivers from "../../hooks/useDriver";
import useLocations from "../../hooks/useLocation";
import useTrips from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TripHistory() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { trips, loading } = useTrips(firebase_uid || "");
  const { drivers } = useDrivers(firebase_uid || "");
  const { clients } = useClients(firebase_uid || "");
  const { trucks } = useTrucks(firebase_uid || "");
  const { locations } = useLocations(firebase_uid || "");

  // --- Filter states ---
  const [filters, setFilters] = useState({
    driver_id: "",
    client_id: "",
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

  // === Mapping helper functions ===
  const getDriverName = (id: number) =>
    drivers.find((d) => d.driver_id === id)?.driver_name || "Unknown Driver";

  const getClientName = (id: number) =>
    clients.find((c) => c.client_id === id)?.client_name || "Unknown Client";

  const getTruckReg = (id: number) =>
    trucks.find((t) => t.truck_id === id)?.registration_number || "Unknown Truck";

  const getLocationName = (id: number) =>
    locations.find((l) => l.location_id === id)?.location_name || "Unknown";

  // === Sorting & Filtering ===
  const sortedTrips = useMemo(() => {
    let filtered = [...trips];

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

  // === Dropdown items ===
  const driverItems = drivers.map((d) => ({
    label: d.driver_name,
    value: String(d.driver_id),
  }));

  const clientItems = clients.map((c) => ({
    label: c.client_name,
    value: String(c.client_id),
  }));

  // === Date formatting helper ===
  const formatDate = (date: Date | null) =>
    date ? date.toISOString().split("T")[0] : "Select Date";

  // === Toggle Filters Animation ===
  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  return (
    <SafeAreaView className="flex-1 bg-background ">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ========== FILTERS ========== */}
        <View className="mx-3 mb-6 p-5 bg-card rounded-2xl border border-border shadow-md">
          {/* Header */}
          <TouchableOpacity
            onPress={toggleFilters}
            className="flex-row items-center justify-between"
          >
            <Text className="text-xl font-semibold text-foreground">
              Filters
            </Text>
            <Text className="text-primary font-medium">
              {showFilters ? "Hide ▲" : "Show ▼"}
            </Text>
          </TouchableOpacity>

          {showFilters && (
            <>
              {/* Dropdown Row */}
              <View className="flex-row space-x-3 mt-5">
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1 ml-1">
                    Driver
                  </Text>
                  <DropDownPicker
                    open={dropdowns.driver}
                    value={filters.driver_id}
                    items={driverItems}
                    setOpen={(callback) =>
                      setDropdowns((prev) => ({
                        ...prev,
                        driver:
                          typeof callback === "function"
                            ? callback(prev.driver)
                            : callback,
                      }))
                    }
                    setValue={(callback) =>
                      setFilters((prev) => ({
                        ...prev,
                        driver_id:
                          typeof callback === "function"
                            ? callback(prev.driver_id)
                            : callback,
                      }))
                    }
                    placeholder="Select Driver"
                    style={{
                      backgroundColor: "hsl(var(--input-bg))",
                      borderColor: "hsl(var(--input-border))",
                    }}
                    dropDownContainerStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                    textStyle={{ color: "hsl(var(--input-text))" }}
                    placeholderStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1 ml-1">
                    Client
                  </Text>
                  <DropDownPicker
                    open={dropdowns.client}
                    value={filters.client_id}
                    items={clientItems}
                    setOpen={(callback) =>
                      setDropdowns((prev) => ({
                        ...prev,
                        client:
                          typeof callback === "function"
                            ? callback(prev.client)
                            : callback,
                      }))
                    }
                    setValue={(callback) =>
                      setFilters((prev) => ({
                        ...prev,
                        client_id:
                          typeof callback === "function"
                            ? callback(prev.client_id)
                            : callback,
                      }))
                    }
                    placeholder="Select Client"
                    style={{
                      backgroundColor: "hsl(var(--input-bg))",
                      borderColor: "hsl(var(--input-border))",
                    }}
                    dropDownContainerStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                    textStyle={{ color: "hsl(var(--input-text))" }}
                    placeholderStyle={{
                      color: "hsl(var(--muted-foreground))",
                    }}
                  />
                </View>
              </View>

              {/* Date Range */}
              <View className="flex-row justify-between space-x-3 mt-4">
                <TouchableOpacity
                  onPress={() => setShowDatePicker({ field: "startDate" })}
                  className="flex-1 border border-border rounded-xl px-4 py-3 bg-input-bg"
                >
                  <Text className="text-sm text-muted-foreground mb-1">
                    From
                  </Text>
                  <Text className="text-foreground font-medium">
                    {formatDate(filters.startDate)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowDatePicker({ field: "endDate" })}
                  className="flex-1 border border-border rounded-xl px-4 py-3 bg-input-bg"
                >
                  <Text className="text-sm text-muted-foreground mb-1">To</Text>
                  <Text className="text-foreground font-medium">
                    {formatDate(filters.endDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reset Filters */}
              <TouchableOpacity
                onPress={() =>
                  setFilters({
                    driver_id: "",
                    client_id: "",
                    startDate: null,
                    endDate: null,
                  })
                }
                className="bg-primary mt-5 rounded-lg py-3"
              >
                <Text className="text-center text-primary-foreground font-semibold">
                  Reset Filters
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* === DATE PICKER === */}
        {showDatePicker.field && (
          <DateTimePicker
            value={filters[showDatePicker.field] || new Date()}
            mode="date"
            display="default"
            onChange={(e, selected) => {
              setShowDatePicker({ field: null });
              if (selected) {
                setFilters((p) => ({
                  ...p,
                  [showDatePicker.field!]: selected,
                }));
              }
            }}
          />
        )}

        {/* === Trip List === */}
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
              className="bg-card border border-border rounded-xl mx-3 mb-4 p-5 shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-semibold text-base text-foreground">
                  {getClientName(trip.client_id)}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {trip.trip_date}
                </Text>
              </View>

              <Text className="text-foreground mb-1">
                🧍 Driver:{" "}
                <Text className="text-muted-foreground">
                  {getDriverName(trip.driver_id)}
                </Text>
              </Text>

              <Text className="text-foreground mb-1">
                🚚 Truck:{" "}
                <Text className="text-muted-foreground">
                  {getTruckReg(trip.truck_id)}
                </Text>
              </Text>

              <Text className="text-foreground mb-1">
                📍 From:{" "}
                <Text className="text-muted-foreground">
                  {getLocationName(trip.start_location_id)}
                </Text>
              </Text>

              <Text className="text-foreground mb-1">
                🏁 To:{" "}
                <Text className="text-muted-foreground">
                  {getLocationName(trip.end_location_id)}
                </Text>
              </Text>

              <Text className="text-foreground mb-1">
                💰 Cost of Trip:{" "}
                <Text className="text-primary font-semibold">
                  ₹{trip.cost_of_trip?.toLocaleString() || 0}
                </Text>
              </Text>

              {trip.miscellaneous_expense > 0 && (
                <Text className="text-foreground mb-1">
                  🧾 Misc Expense:{" "}
                  <Text className="text-orange-500 font-semibold">
                    ₹{trip.miscellaneous_expense?.toLocaleString()}
                  </Text>
                </Text>
              )}

              {trip.notes ? (
                <Text className="text-muted-foreground italic mt-2">
                  🗒️ {trip.notes}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
