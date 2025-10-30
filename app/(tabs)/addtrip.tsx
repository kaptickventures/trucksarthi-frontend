import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import useTrucks from "../../hooks/useTruck";
import useDrivers from "../../hooks/useDriver";
import useClients from "../../hooks/useClient";
import useLocations from "../../hooks/useLocation";
import useTrips from "../../hooks/useTrip";
import { getAuth } from "firebase/auth";

export default function AddTrip() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;


  const { trucks, loading: loadingTrucks } = useTrucks(firebase_uid || "");
  const { drivers, loading: loadingDrivers } = useDrivers(firebase_uid || "");
  const { clients, loading: loadingClients } = useClients(firebase_uid || "");
  const { locations, loading: loadingLocations } = useLocations(firebase_uid || "");
  const { addTrip } = useTrips(firebase_uid || "");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    truck_id: "",
    driver_id: "",
    client_id: "",
    start_location_id: "",
    end_location_id: "",
    cost_of_trip: "",
    miscellaneous_expense: "",
    notes: "",
  });

  const [dropdowns, setDropdowns] = useState({
    truck: false,
    driver: false,
    client: false,
    start: false,
    end: false,
  });

  const loading =
    !firebase_uid ||
    loadingTrucks ||
    loadingDrivers ||
    loadingClients ||
    loadingLocations;

  const handleSubmit = async () => {
    const {
      truck_id,
      driver_id,
      client_id,
      start_location_id,
      end_location_id,
      cost_of_trip,
    } = formData;

    if (!truck_id || !driver_id || !client_id || !start_location_id || !end_location_id || !cost_of_trip) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    try {
      await addTrip({
        truck_id: Number(truck_id),
        driver_id: Number(driver_id),
        client_id: Number(client_id),
        start_location_id: Number(start_location_id),
        end_location_id: Number(end_location_id),
        cost_of_trip: Number(cost_of_trip),
        miscellaneous_expense: Number(formData.miscellaneous_expense || 0),
        notes: formData.notes,
      });
      Alert.alert("Success", "Trip created successfully!");
      setFormData({
        date: new Date().toISOString().split("T")[0],
        truck_id: "",
        driver_id: "",
        client_id: "",
        start_location_id: "",
        end_location_id: "",
        cost_of_trip: "",
        miscellaneous_expense: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error adding trip:", err);
      Alert.alert("Error", "Failed to add trip. Please try again.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-black">Loading data...</Text>
      </View>
    );
  }

  const dropdownData = [
    {
      label: "Truck",
      key: "truck_id",
      openKey: "truck",
      items: trucks.map((t) => ({
        value: String(t.truck_id),
      })),
    },
    {
      label: "Driver",
      key: "driver_id",
      openKey: "driver",
      items: drivers.map((d) => ({
        label: d.driver_name,
        value: String(d.driver_id),
      })),
    },
    {
      label: "Client",
      key: "client_id",
      openKey: "client",
      items: clients.map((c) => ({
        label: c.client_name,
        value: String(c.client_id),
      })),
    },
    {
      label: "Start Location",
      key: "start_location_id",
      openKey: "start",
      items: locations.map((l) => ({
        label: l.location_name,
        value: String(l.location_id),
      })),
    },
    {
      label: "End Location",
      key: "end_location_id",
      openKey: "end",
      items: locations.map((l) => ({
        label: l.location_name,
        value: String(l.location_id),
      })),
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 120 }}>
          <Text className="text-black mb-1 font-medium">Date *</Text>
          <TextInput
            className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-3"
            value={formData.date}
            editable={false}
          />

          {dropdownData.map((d, i) => (
            <View key={i} style={{ marginBottom: dropdowns[d.openKey as keyof typeof dropdowns] ? 150 : 12 }}>
              <Text className="text-black mb-1 font-medium">{d.label} *</Text>
              <DropDownPicker
                open={dropdowns[d.openKey as keyof typeof dropdowns]}
                value={formData[d.key as keyof typeof formData]}
                items={d.items}
                setOpen={(o) => setDropdowns((p) => ({ ...p, [d.openKey]: o }))}
                setValue={(cb) =>
                  setFormData((prev) => ({
                    ...prev,
                    [d.key]: cb(prev[d.key as keyof typeof formData]),
                  }))
                }
                placeholder={`Select ${d.label}`}
                style={{ backgroundColor: "#f8f8f8", borderColor: "#ccc" }}
                dropDownContainerStyle={{ backgroundColor: "#fff" }}
              />
            </View>
          ))}

          <Text className="text-black mb-1 font-medium">Cost of Trip (₹) *</Text>
          <TextInput
            keyboardType="numeric"
            className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-3"
            value={formData.cost_of_trip}
            onChangeText={(text) => setFormData({ ...formData, cost_of_trip: text })}
          />

          <Text className="text-black mb-1 font-medium">Miscellaneous Expense (₹)</Text>
          <TextInput
            keyboardType="numeric"
            className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-3"
            value={formData.miscellaneous_expense}
            onChangeText={(text) => setFormData({ ...formData, miscellaneous_expense: text })}
          />

          <Text className="text-black mb-1 font-medium">Notes</Text>
          <TextInput
            multiline
            numberOfLines={3}
            className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-6"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
          />

          <TouchableOpacity onPress={handleSubmit} className="bg-black p-4 rounded-xl items-center mb-10">
            <Text className="text-white font-semibold">Add Trip</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
