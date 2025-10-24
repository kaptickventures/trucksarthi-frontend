import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const mockTrips = [
  {
    id: 1,
    date: "2024-01-15",
    truck: "MH-01-AB-1234",
    driver: "Rajesh Kumar",
    client: "ABC Logistics",
    startLocation: "Mumbai",
    endLocation: "Delhi",
    tripCost: 45000,
    miscExpense: 2000,
  },
  {
    id: 2,
    date: "2024-01-14",
    truck: "MH-02-CD-5678",
    driver: "Amit Sharma",
    client: "XYZ Transport",
    startLocation: "Pune",
    endLocation: "Bangalore",
    tripCost: 38000,
    miscExpense: 1500,
  },
];

export default function ViewTrips() {
  const [filters, setFilters] = useState({ driver: "", client: "", startDate: "" });

  const totalAmount = mockTrips.reduce(
    (sum, t) => sum + t.tripCost + t.miscExpense,
    0
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b border-border px-4 py-3">
        <Text className="text-xl font-semibold text-center text-foreground">
          View Trips
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        <View className="bg-card rounded-lg p-4 border border-border mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="filter" size={18} color="#555" />
            <Text className="ml-2 font-semibold text-foreground">Filters</Text>
          </View>

          {/* Driver */}
          <View className="mb-3 border border-border rounded-lg">
            <Picker
              selectedValue={filters.driver}
              onValueChange={(v) => setFilters({ ...filters, driver: v })}
            >
              <Picker.Item label="All Drivers" value="" />
              <Picker.Item label="Rajesh Kumar" value="rajesh" />
              <Picker.Item label="Amit Sharma" value="amit" />
            </Picker>
          </View>

          {/* Client */}
          <View className="mb-3 border border-border rounded-lg">
            <Picker
              selectedValue={filters.client}
              onValueChange={(v) => setFilters({ ...filters, client: v })}
            >
              <Picker.Item label="All Clients" value="" />
              <Picker.Item label="ABC Logistics" value="abc" />
              <Picker.Item label="XYZ Transport" value="xyz" />
            </Picker>
          </View>

          {/* Start Date */}
          <TextInput
            placeholder="Start Date (YYYY-MM-DD)"
            placeholderTextColor="#888"
            value={filters.startDate}
            onChangeText={(v) => setFilters({ ...filters, startDate: v })}
            className="border border-border rounded-lg p-3 text-foreground"
          />
        </View>

        {/* Trips List */}
        {mockTrips.map((trip) => (
          <View
            key={trip.id}
            className="bg-card p-4 rounded-lg border border-border mb-3"
          >
            <Text className="text-muted-foreground text-xs mb-1">
              {trip.date}
            </Text>
            <Text className="text-foreground font-medium">
              {trip.startLocation} → {trip.endLocation}
            </Text>
            <Text className="text-muted-foreground mt-1">
              Driver: {trip.driver} | Client: {trip.client}
            </Text>
            <Text className="text-primary font-semibold mt-2">
              ₹{(trip.tripCost + trip.miscExpense).toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View className="bg-primary p-4 rounded-lg mt-4">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-lg text-primary-foreground">
              Total Amount
            </Text>
            <Text className="font-bold text-xl text-primary-foreground">
              ₹{totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
