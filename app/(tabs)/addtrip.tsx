import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

// Mock data
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

  // Dropdown open states
  const [openTruck, setOpenTruck] = useState(false);
  const [openDriver, setOpenDriver] = useState(false);
  const [openClient, setOpenClient] = useState(false);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const handleSubmit = () => {
    Alert.alert("Trip Added", "New trip has been created successfully!");
    setFormData({
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
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="bg-card border border-border rounded-2xl p-4 mb-6">
        <Text className="text-xl font-semibold text-center text-foreground">Add New Trip</Text>
      </View>

      {/* Date */}
      <View className="mb-3">
        <Text className="text-foreground mb-1 font-medium">Date *</Text>
        <TextInput
          className="border border-border rounded-lg p-3 bg-card text-foreground"
          value={formData.date}
          onChangeText={(text) => setFormData({ ...formData, date: text })}
        />
      </View>

      {/* Truck Dropdown */}
      <Text className="text-foreground mb-1 font-medium">Truck Registration Number *</Text>
      <DropDownPicker
        open={openTruck}
        value={formData.truckNumber}
        items={mockTrucks.map((truck) => ({ label: truck, value: truck }))}
        setOpen={setOpenTruck}
        setValue={(cb) =>
          setFormData((prev) => ({ ...prev, truckNumber: cb(prev.truckNumber) }))
        }
        placeholder="Select truck"
        style={{ backgroundColor: "#f5f5f5", borderColor: "#ccc" }}
        dropDownContainerStyle={{ backgroundColor: "#fff" }}
      />

      {/* Driver Dropdown */}
      <Text className="text-foreground mt-4 mb-1 font-medium">Drivers Name *</Text>
      <DropDownPicker
        open={openDriver}
        value={formData.driverName}
        items={mockDrivers.map((driver) => ({ label: driver, value: driver }))}
        setOpen={setOpenDriver}
        setValue={(cb) =>
          setFormData((prev) => ({ ...prev, driverName: cb(prev.driverName) }))
        }
        placeholder="Select driver"
        style={{ backgroundColor: "#f5f5f5", borderColor: "#ccc" }}
        dropDownContainerStyle={{ backgroundColor: "#fff" }}
      />

      {/* Client Dropdown */}
      <Text className="text-foreground mt-4 mb-1 font-medium">Clients Name *</Text>
      <DropDownPicker
        open={openClient}
        value={formData.clientName}
        items={mockClients.map((client) => ({ label: client, value: client }))}
        setOpen={setOpenClient}
        setValue={(cb) =>
          setFormData((prev) => ({ ...prev, clientName: cb(prev.clientName) }))
        }
        placeholder="Select client"
        style={{ backgroundColor: "#f5f5f5", borderColor: "#ccc" }}
        dropDownContainerStyle={{ backgroundColor: "#fff" }}
      />

      {/* Start Location */}
      <Text className="text-foreground mt-4 mb-1 font-medium">Start Location *</Text>
      <DropDownPicker
        open={openStart}
        value={formData.startLocation}
        items={mockLocations.map((loc) => ({ label: loc, value: loc }))}
        setOpen={setOpenStart}
        setValue={(cb) =>
          setFormData((prev) => ({ ...prev, startLocation: cb(prev.startLocation) }))
        }
        placeholder="Select start location"
        style={{ backgroundColor: "#f5f5f5", borderColor: "#ccc" }}
        dropDownContainerStyle={{ backgroundColor: "#fff" }}
      />

      {/* End Location */}
      <Text className="text-foreground mt-4 mb-1 font-medium">End Location *</Text>
      <DropDownPicker
        open={openEnd}
        value={formData.endLocation}
        items={mockLocations.map((loc) => ({ label: loc, value: loc }))}
        setOpen={setOpenEnd}
        setValue={(cb) =>
          setFormData((prev) => ({ ...prev, endLocation: cb(prev.endLocation) }))
        }
        placeholder="Select end location"
        style={{ backgroundColor: "#f5f5f5", borderColor: "#ccc" }}
        dropDownContainerStyle={{ backgroundColor: "#fff" }}
      />

      {/* Trip Cost */}
      <View className="mt-4">
        <Text className="text-foreground mb-1 font-medium">Cost of Trip (₹) *</Text>
        <TextInput
          keyboardType="numeric"
          className="border border-border rounded-lg p-3 bg-card text-foreground"
          value={formData.tripCost}
          onChangeText={(text) => setFormData({ ...formData, tripCost: text })}
        />
      </View>

      {/* Misc Expense */}
      <View className="mt-4">
        <Text className="text-foreground mb-1 font-medium">Miscellaneous Expense (₹)</Text>
        <TextInput
          keyboardType="numeric"
          className="border border-border rounded-lg p-3 bg-card text-foreground"
          value={formData.miscExpense}
          onChangeText={(text) => setFormData({ ...formData, miscExpense: text })}
        />
      </View>

      {/* Notes */}
      <View className="mt-4">
        <Text className="text-foreground mb-1 font-medium">Notes</Text>
        <TextInput
          multiline
          numberOfLines={3}
          className="border border-border rounded-lg p-3 bg-card text-foreground"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-primary p-4 rounded-xl mt-6 items-center"
      >
        <Text className="text-white font-semibold">Add Trip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
