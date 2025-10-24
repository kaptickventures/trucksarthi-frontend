import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const mockTrucks = ["MH-01-AB-1234", "MH-02-CD-5678", "GJ-03-EF-9012"];
const mockDrivers = ["Rajesh Kumar", "Amit Sharma", "Suresh Patel"];
const mockClients = ["ABC Logistics", "XYZ Transport", "Global Shipping"];
const mockLocations = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai"];

export default function AddTrip() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    truckNumber: "",
    driverName: "",
    clientName: "",
    startLocation: "",
    endLocation: "",
    tripCost: "",
    miscExpense: "",
    notes: "",
  });

  const [dropdowns, setDropdowns] = useState({
    truckNumber: false,
    driverName: false,
    clientName: false,
    startLocation: false,
    endLocation: false,
  });

  const handleSubmit = () => {
    Alert.alert("Trip Added", "New trip has been created successfully!");
  };

  const dropdownData = [
    { label: "Truck Registration Number *", key: "truckNumber", items: mockTrucks },
    { label: "Driver Name *", key: "driverName", items: mockDrivers },
    { label: "Client Name *", key: "clientName", items: mockClients },
    { label: "Start Location *", key: "startLocation", items: mockLocations },
    { label: "End Location *", key: "endLocation", items: mockLocations },
  ];

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="bg-card border border-border rounded-2xl p-4 mb-6">
        <Text className="text-xl font-semibold text-center text-foreground">
          Add New Trip
        </Text>
      </View>

      {/* Date */}
      <Text className="text-foreground mb-1 font-medium">Date *</Text>
      <TextInput
        className="border border-border rounded-lg p-3 bg-card text-foreground mb-3"
        value={formData.date}
        onChangeText={(text) => setFormData({ ...formData, date: text })}
      />

      {/* Dropdowns */}
      {dropdownData.map((d, i) => (
        <View
          key={i}
          style={{ marginBottom: dropdowns[d.key as keyof typeof dropdowns] ? 150 : 12 }}
        >
          <Text className="text-foreground mb-1 font-medium">{d.label}</Text>
          <DropDownPicker
            open={dropdowns[d.key as keyof typeof dropdowns]}
            value={formData[d.key as keyof typeof formData]}
            items={d.items.map((x) => ({ label: x, value: x }))}
            setOpen={(o) =>
              setDropdowns((prev) => ({ ...prev, [d.key]: o }))
            }
            setValue={(cb) =>
              setFormData((prev) => ({
                ...prev,
                [d.key]: cb(prev[d.key as keyof typeof formData]),
              }))
            }
            placeholder={`Select ${d.label.split(" ")[0].toLowerCase()}`}
            style={{ backgroundColor: "#f8f8f8", borderColor: "#ccc" }}
            dropDownContainerStyle={{ backgroundColor: "#fff" }}
          />
        </View>
      ))}

      {/* Trip Cost */}
      <Text className="text-foreground mb-1 font-medium">Cost of Trip (₹) *</Text>
      <TextInput
        keyboardType="numeric"
        className="border border-border rounded-lg p-3 bg-card text-foreground mb-3"
        value={formData.tripCost}
        onChangeText={(text) => setFormData({ ...formData, tripCost: text })}
      />

      {/* Misc Expense */}
      <Text className="text-foreground mb-1 font-medium">
        Miscellaneous Expense (₹)
      </Text>
      <TextInput
        keyboardType="numeric"
        className="border border-border rounded-lg p-3 bg-card text-foreground mb-3"
        value={formData.miscExpense}
        onChangeText={(text) => setFormData({ ...formData, miscExpense: text })}
      />

      {/* Notes */}
      <Text className="text-foreground mb-1 font-medium">Notes</Text>
      <TextInput
        multiline
        numberOfLines={3}
        className="border border-border rounded-lg p-3 bg-card text-foreground mb-6"
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
      />

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-primary p-4 rounded-xl items-center"
      >
        <Text className="text-primary-foreground font-semibold">Add Trip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
