import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import '../../global.css'

const recentTrips = [
  { id: 1, date: "2024-01-15", truck: "MH-01-AB-1234", driver: "Rajesh Kumar", route: "Mumbai → Delhi", amount: 47000 },
  { id: 2, date: "2024-01-14", truck: "MH-02-CD-5678", driver: "Amit Sharma", route: "Pune → Bangalore", amount: 39500 },
  { id: 3, date: "2024-01-13", truck: "GJ-03-EF-9012", driver: "Suresh Patel", route: "Ahmedabad → Chennai", amount: 52000 },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Stats Section */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 bg-card rounded-2xl p-4 mr-2">
          <Text className="text-muted-foreground text-xs">Monthly Revenue</Text>
          <Text className="text-card-foreground text-xl font-bold mt-1">₹4,52,310</Text>
          <Text className="text-accent text-xs mt-1">▲ +12.5%</Text>
        </View>
        <View className="flex-1 bg-card rounded-2xl p-4 ml-2">
          <Text className="text-muted text-xs">Number of Trips</Text>
          <Text className="text-card-foreground text-xl font-bold mt-1">142</Text>
          <Text className="text-accent text-xs mt-1">▲  +8.2%</Text>
        </View>
      </View>

      {/* Add Trip Button */}
      <TouchableOpacity
        onPress={() => router.push("/addtrip")}
        className="bg-primary rounded-full py-4 flex-row justify-center items-center mb-6"
      >
        <Ionicons name="car-outline" size={20} color="white" />
        <Text className="text-primary-foreground font-semibold text-base ml-2">Add Trip</Text>
      </TouchableOpacity>

      {/* Secondary Actions */}
      <View className="flex-row justify-between mb-6">
        {[
          { title: "Location", icon: "location-outline" },
          { title: "Driver", icon: "person-add-outline" },
          { title: "Client", icon: "people-outline" },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => router.push(`/manager`)}
            className="flex-1 bg-card rounded-xl p-3 items-center mx-1"
          >
            <Ionicons name={item.icon as any} size={22} color="#A855F7" />
            <Text className="text-muted text-xs mt-2">{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Trips */}
      <View className="bg-card rounded-2xl p-4 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-card-foreground font-semibold text-lg">Recent Trips</Text>
          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text className="text-accent text-sm">View All →</Text>
          </TouchableOpacity>
        </View>

        {recentTrips.map((trip) => (
          <View
            key={trip.id}
            className="flex-row justify-between items-center bg-secondary p-3 rounded-xl mb-2"
          >
            <View className="flex-1">
              <Text className="text-card-foreground font-medium text-sm">{trip.route}</Text>
              <Text className="text-muted text-xs mt-1">{trip.truck} • {trip.driver}</Text>
            </View>
            <View className="items-end">
              <Text className="text-accent font-semibold">₹{trip.amount.toLocaleString()}</Text>
              <Text className="text-muted text-xs">{trip.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Info Cards */}
      <View className="flex-row flex-wrap justify-between">
        {[
          { title: "Active Vehicles", value: "24", subtitle: "2 in maintenance", icon: "bus-outline" },
          { title: "Deliveries Today", value: "18", subtitle: "3 pending pickup", icon: "cube-outline" },
          { title: "Avg. Delivery Time", value: "4.2h", subtitle: "15% faster", icon: "time-outline" },
          { title: "Fuel Efficiency", value: "12 km/l", subtitle: "Fleet avg.", icon: "flame-outline" },
        ].map((card, idx) => (
          <View
            key={idx}
            className="w-[48%] bg-card rounded-2xl p-4 mb-4"
          >
            <Ionicons name={card.icon as any} size={22} color="#A855F7" />
            <Text className="text-card-foreground font-semibold mt-2">{card.title}</Text>
            <Text className="text-card-foreground text-lg font-bold mt-1">{card.value}</Text>
            <Text className="text-muted text-xs">{card.subtitle}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
