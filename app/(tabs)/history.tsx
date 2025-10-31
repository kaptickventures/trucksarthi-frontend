import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import useTrips from "../../hooks/useTrip";
import useDrivers from "../../hooks/useDriver";
import useClients from "../../hooks/useClient";
import useTrucks from "../../hooks/useTruck";
import useLocations from "../../hooks/useLocation";

export default function TripHistory() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { trips, loading } = useTrips(firebase_uid || "");
  const { drivers } = useDrivers(firebase_uid || "");
  const { clients } = useClients(firebase_uid || "");
  const { trucks } = useTrucks(firebase_uid || "");
  const { locations } = useLocations(firebase_uid || "");

  // ✅ Map IDs to readable names
  const getDriverName = (id: number) =>
    drivers.find((d) => d.driver_id === id)?.driver_name || "Unknown Driver";

  const getClientName = (id: number) =>
    clients.find((c) => c.client_id === id)?.client_name || "Unknown Client";

  const getTruckReg = (id: number) =>
    trucks.find((t) => t.truck_id === id)?.registration_number || "Unknown Truck";

  const getLocationName = (id: number) =>
    locations.find((l) => l.location_id === id)?.location_name || "Unknown";

  // ✅ Sort latest first
  const sortedTrips = useMemo(() => {
    return [...trips].sort(
      (a: any, b: any) =>
        new Date(b.trip_date).getTime() - new Date(a.trip_date).getTime()
    );
  }, [trips]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-center text-2xl font-bold mt-4 text-foreground">
          Trip History
        </Text>

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
              {/* Header */}
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-semibold text-base text-foreground">
                  {getClientName(trip.client_id)}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {trip.trip_date}
                </Text>
              </View>

              {/* Trip Info */}
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
