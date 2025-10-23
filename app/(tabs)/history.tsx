import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

interface Trip {
  id: number;
  date: string;
  truck: string;
  driver: string;
  client: string;
  startLocation: string;
  endLocation: string;
  tripCost: number;
  miscExpense: number;
}

const mockTrips: Trip[] = [
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
  const [filters, setFilters] = useState({
    driver: "",
    client: "",
    startDate: "",
  });

  const totalAmount = mockTrips.reduce(
    (sum, t) => sum + t.tripCost + t.miscExpense,
    0
  );

  const handlePrint = () => {
    console.log("Preparing print view...");
  };

  const handleShare = () => {
    console.log("Generating PDF...");
  };

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

          {/* Driver Select */}
          <View className="mb-3 border border-border rounded-lg">
            <Picker
              selectedValue={filters.driver}
              onValueChange={(v) => setFilters({ ...filters, driver: v })}
            >
              <Picker.Item label="Select driver" value="" />
              <Picker.Item label="All Drivers" value="all" />
              <Picker.Item label="Rajesh Kumar" value="rajesh" />
              <Picker.Item label="Amit Sharma" value="amit" />
            </Picker>
          </View>

          {/* Client Select */}
          <View className="mb-3 border border-border rounded-lg">
            <Picker
              selectedValue={filters.client}
              onValueChange={(v) => setFilters({ ...filters, client: v })}
            >
              <Picker.Item label="Select client" value="" />
              <Picker.Item label="All Clients" value="all" />
              <Picker.Item label="ABC Logistics" value="abc" />
              <Picker.Item label="XYZ Transport" value="xyz" />
            </Picker>
          </View>

          {/* Start Date */}
          <TextInput
            placeholder="Start Date"
            placeholderTextColor="#888"
            value={filters.startDate}
            onChangeText={(v) => setFilters({ ...filters, startDate: v })}
            className="border border-border rounded-lg p-3 text-foreground"
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={handlePrint}
            className="flex-1 flex-row items-center justify-center bg-card border border-border rounded-lg py-3"
          >
            <Ionicons name="print-outline" size={18} color="#0f0f0f" />
            <Text className="ml-2 text-foreground font-medium">Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 flex-row items-center justify-center bg-card border border-border rounded-lg py-3"
          >
            <Ionicons name="share-social-outline" size={18} color="#0f0f0f" />
            <Text className="ml-2 text-foreground font-medium">Share PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Trips List */}
        {mockTrips.map((trip) => (
          <View
            key={trip.id}
            className="bg-card p-4 rounded-lg border border-border mb-3"
          >
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Date</Text>
                <Text className="font-medium">{trip.date}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Truck</Text>
                <Text className="font-medium">{trip.truck}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mt-2">
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Driver</Text>
                <Text className="font-medium">{trip.driver}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Client</Text>
                <Text className="font-medium">{trip.client}</Text>
              </View>
            </View>

            <View className="mt-2">
              <Text className="text-muted-foreground text-xs">Route</Text>
              <Text className="font-medium">
                {trip.startLocation} → {trip.endLocation}
              </Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Trip Cost</Text>
                <Text className="font-medium text-primary">
                  ₹{trip.tripCost.toLocaleString()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">
                  Misc Expense
                </Text>
                <Text className="font-medium">
                  ₹{trip.miscExpense.toLocaleString()}
                </Text>
              </View>
            </View>
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
