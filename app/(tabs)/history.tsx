import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import useTrips from "../../hooks/useTrip";
import { getAuth } from "firebase/auth";

export default function ViewTrips() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;


  const { trips, loading } = useTrips(firebase_uid || "");

  // Filter state
  const [filters, setFilters] = useState({
    driver: "",
    client: "",
    startDate: "",
  });

  // Dropdown open state
  const [driverOpen, setDriverOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);

  // Extract unique driver & client names for filters
  const driverItems = useMemo(() => {
    const uniqueDrivers = Array.from(
      new Set(trips.map((t: any) => t.driver_name || "Unknown Driver"))
    );
    return [{ label: "All Drivers", value: "" }].concat(
      uniqueDrivers.map((name) => ({ label: name, value: name }))
    );
  }, [trips]);

  const clientItems = useMemo(() => {
    const uniqueClients = Array.from(
      new Set(trips.map((t: any) => t.client_name || "Unknown Client"))
    );
    return [{ label: "All Clients", value: "" }].concat(
      uniqueClients.map((name) => ({ label: name, value: name }))
    );
  }, [trips]);

  // Filter logic
  const filteredTrips = useMemo(() => {
    return trips.filter((t: any) => {
      const matchesDriver =
        !filters.driver || t.driver_name === filters.driver;
      const matchesClient =
        !filters.client || t.client_name === filters.client;
      const matchesDate =
        !filters.startDate || t.trip_date >= filters.startDate;
      return matchesDriver && matchesClient && matchesDate;
    });
  }, [trips, filters]);

  // Total cost
  const totalAmount = filteredTrips.reduce(
    (sum, t: any) =>
      sum + (t.cost_of_trip || 0) + (t.miscellaneous_expense || 0),
    0
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        <View className="bg-card rounded-lg p-4 border border-border mb-5 mx-3">
          <View className="flex-row items-center mb-3">
            <Ionicons name="filter" size={18} color="#555" />
            <Text className="ml-2 font-semibold text-foreground text-base">
              Filters
            </Text>
          </View>

          {/* Driver Filter */}
          <View className="z-20" style={{ marginBottom: driverOpen ? 150 : 12 }}>
            <DropDownPicker
              open={driverOpen}
              value={filters.driver}
              items={driverItems}
              setOpen={setDriverOpen}
              setValue={(cb) =>
                setFilters((prev) => ({ ...prev, driver: cb(prev.driver) }))
              }
              placeholder="Select Driver"
              style={{ backgroundColor: "#fff", borderColor: "#ccc" }}
              dropDownContainerStyle={{ borderColor: "#ccc" }}
            />
          </View>

          {/* Client Filter */}
          <View className="z-10" style={{ marginBottom: clientOpen ? 150 : 12 }}>
            <DropDownPicker
              open={clientOpen}
              value={filters.client}
              items={clientItems}
              setOpen={setClientOpen}
              setValue={(cb) =>
                setFilters((prev) => ({ ...prev, client: cb(prev.client) }))
              }
              placeholder="Select Client"
              style={{ backgroundColor: "#fff", borderColor: "#ccc" }}
              dropDownContainerStyle={{ borderColor: "#ccc" }}
            />
          </View>

          {/* Start Date Filter */}
          <TextInput
            placeholder="Start Date (YYYY-MM-DD)"
            placeholderTextColor="#888"
            value={filters.startDate}
            onChangeText={(v) => setFilters({ ...filters, startDate: v })}
            className="border border-border rounded-lg p-3 text-foreground"
          />
        </View>

        {/* Trips Section */}
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" className="mt-10" />
        ) : filteredTrips.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No trips found
          </Text>
        ) : (
          filteredTrips
            .sort(
              (a: any, b: any) =>
                new Date(b.trip_date).getTime() -
                new Date(a.trip_date).getTime()
            )
            .map((trip: any) => (
              <View
                key={trip.trip_id}
                className="bg-card p-5 rounded-xl border border-border shadow-sm mb-4 mx-3"
              >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-foreground font-semibold text-base">
                    Trip #{trip.trip_id}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {trip.trip_date}
                  </Text>
                </View>

                {/* Trip Details */}
                <Text className="text-foreground mb-1">
                  🧍 Driver:{" "}
                  <Text className="text-muted-foreground">
                    {trip.driver_name || "N/A"}
                  </Text>
                </Text>
                <Text className="text-foreground mb-1">
                  🏢 Client:{" "}
                  <Text className="text-muted-foreground">
                    {trip.client_name || "N/A"}
                  </Text>
                </Text>
                <Text className="text-foreground mb-1">
                  🚚 Truck ID:{" "}
                  <Text className="text-muted-foreground">
                    {trip.truck_id || "N/A"}
                  </Text>
                </Text>
                <Text className="text-foreground mb-1">
                  📍 From:{" "}
                  <Text className="text-muted-foreground">
                    {trip.start_location_name || trip.start_location_id}
                  </Text>
                </Text>
                <Text className="text-foreground mb-1">
                  🏁 To:{" "}
                  <Text className="text-muted-foreground">
                    {trip.end_location_name || trip.end_location_id}
                  </Text>
                </Text>

                <Text className="text-foreground mb-1">
                  💰 Cost of Trip:{" "}
                  <Text className="text-primary font-semibold">
                    ₹{trip.cost_of_trip?.toLocaleString() || 0}
                  </Text>
                </Text>

                <Text className="text-foreground mb-1">
                  🧾 Misc Expense:{" "}
                  <Text className="text-orange-500 font-semibold">
                    ₹{trip.miscellaneous_expense?.toLocaleString() || 0}
                  </Text>
                </Text>

                {trip.notes ? (
                  <Text className="text-muted-foreground italic mt-2">
                    🗒️ Notes: {trip.notes}
                  </Text>
                ) : null}
              </View>
            ))
        )}

        {/* Total Summary */}
        {filteredTrips.length > 0 && (
          <View className="bg-primary mx-3 mt-4 p-5 rounded-xl">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-lg text-primary-foreground">
                Total Amount
              </Text>
              <Text className="font-bold text-xl text-primary-foreground">
                ₹{totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
