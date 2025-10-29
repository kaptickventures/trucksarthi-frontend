import React from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useTrips from "../../hooks/useTrip";
import "../../global.css";

export default function HomeScreen() {
  const router = useRouter();
  const userId = 1; // 👈 Replace this with actual logged-in user's ID

  const {
    loading,
    totalRevenue,
    totalTrips,
    recentTrips,
  } = useTrips(userId);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#A855F7" />
        <Text className="text-muted-foreground mt-2">Loading trips...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Revenue + Trips Cards */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 bg-card rounded-2xl p-4 mr-2">
          <Text className="text-muted-foreground text-xs">Monthly Revenue</Text>
          <Text className="text-card-foreground text-xl font-bold mt-1">
            ₹{totalRevenue.toLocaleString()}
          </Text>
          <Text className="text-success text-xs mt-1">▲ +12.5%</Text>
        </View>

        <View className="flex-1 bg-card rounded-2xl p-4 ml-2">
          <Text className="text-muted-foreground text-xs">Number of Trips</Text>
          <Text className="text-card-foreground text-xl font-bold mt-1">
            {totalTrips}
          </Text>
          <Text className="text-success text-xs mt-1">▲ +8.2%</Text>
        </View>
      </View>

      {/* Add Trip Button */}
      <TouchableOpacity
        onPress={() => router.push("/addtrip")}
        className="bg-primary rounded-full py-4 flex-row justify-center items-center mb-6"
      >
        <Ionicons name="car-outline" size={20} color="white" />
        <Text className="text-primary-foreground font-semibold text-base ml-2">
          Add Trip
        </Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View className="flex-row justify-between mb-6">
        {[
          { title: "Location", icon: "location-outline", route: "/manager/locations-manager" as const },
          { title: "Driver", icon: "person-add-outline", route: "/manager/drivers-manager" as const },
          { title: "Client", icon: "people-outline", route: "/manager/clients-manager" as const },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => router.push(item.route)}
            className="flex-1 bg-card rounded-xl p-3 items-center mx-1"
          >
            <Ionicons name={item.icon as any} size={22} color="#A855F7" />
            <Text className="text-muted-foreground text-xs mt-2">{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Trips */}
      <View className="bg-card rounded-2xl p-4 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-card-foreground font-semibold text-lg">Recent Trips</Text>
          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text className="text-success text-sm">View All →</Text>
          </TouchableOpacity>
        </View>

        {recentTrips.length > 0 ? (
          recentTrips.map((trip) => (
            <View
              key={trip.trip_id}
              className="flex-row justify-between items-center bg-secondary p-3 rounded-xl mb-2"
            >
              <View className="flex-1">
                <Text className="text-card-foreground font-medium text-sm">
                  Trip #{trip.trip_id}
                </Text>
                <Text className="text-muted-foreground text-xs mt-1">
                  Truck {trip.truck_id} • Driver {trip.driver_id}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-primary font-semibold">
                  ₹{trip.cost_of_trip.toLocaleString()}
                </Text>
                <Text className="text-muted-foreground text-xs">{trip.trip_date}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-muted-foreground text-center py-4">
            No trips found for this user.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
