import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import useTrucks from "../../hooks/useTruck";
import useDrivers from "../../hooks/useDriver";
import useClients from "../../hooks/useClient";
import useLocations from "../../hooks/useLocation";
import useTrips from "../../hooks/useTrip";

export default function AddTrip() {
  const userId = 1; // your logged-in user_id

  // ✅ Custom hooks
  const { trucks, loading: loadingTrucks } = useTrucks(userId);
  const { drivers, loading: loadingDrivers } = useDrivers(userId);
  const { clients, loading: loadingClients } = useClients(userId);
  const { locations, loading: loadingLocations } = useLocations(userId);
  const { addTrip } = useTrips(userId);

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
    loadingTrucks || loadingDrivers || loadingClients || loadingLocations;

  // ✅ Handle trip submission
  const handleSubmit = async () => {
    const {
      truck_id,
      driver_id,
      client_id,
      start_location_id,
      end_location_id,
      cost_of_trip,
    } = formData;

    if (
      !truck_id ||
      !driver_id ||
      !client_id ||
      !start_location_id ||
      !end_location_id ||
      !cost_of_trip
    ) {
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

  // ✅ Dropdown data with values converted to strings
  const dropdownData = [
    {
      label: "Truck",
      key: "truck_id",
      openKey: "truck",
      items: trucks.map((t) => ({
        label: t.registration_number,
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
    <ScrollView className="flex-1 bg-white p-4">
      <View className="border border-gray-400 rounded-2xl p-4 mb-6">
        <Text className="text-xl font-semibold text-center text-black">
          Add New Trip
        </Text>
      </View>

      {/* Date */}
      <Text className="text-black mb-1 font-medium">Date *</Text>
      <TextInput
        className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-3"
        value={formData.date}
        editable={false}
      />

      {/* Dropdowns */}
      {dropdownData.map((d, i) => (
        <View
          key={i}
          style={{
            marginBottom: dropdowns[d.openKey as keyof typeof dropdowns]
              ? 150
              : 12,
          }}
        >
          <Text className="text-black mb-1 font-medium">{d.label} *</Text>
          <DropDownPicker
            open={dropdowns[d.openKey as keyof typeof dropdowns]}
            value={formData[d.key as keyof typeof formData]}
            items={d.items}
            setOpen={(o) =>
              setDropdowns((prev) => ({ ...prev, [d.openKey]: o }))
            }
            setValue={(cb) =>
              setFormData((prev) => ({
                ...prev,
                [d.key]: cb(prev[d.key as keyof typeof formData]),
              }))
            }
            placeholder={`Select ${d.label}`}
            style={{
              backgroundColor: "#f8f8f8",
              borderColor: "#ccc",
            }}
            dropDownContainerStyle={{ backgroundColor: "#fff" }}
          />
        </View>
      ))}

      {/* Cost of Trip */}
      <Text className="text-black mb-1 font-medium">Cost of Trip (₹) *</Text>
      <TextInput
        keyboardType="numeric"
        className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-3"
        value={formData.cost_of_trip}
        onChangeText={(text) =>
          setFormData({ ...formData, cost_of_trip: text })
        }
      />

      {/* Miscellaneous Expense */}
      <Text className="text-black mb-1 font-medium">
        Miscellaneous Expense (₹)
      </Text>
      <TextInput
        keyboardType="numeric"
        className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-3"
        value={formData.miscellaneous_expense}
        onChangeText={(text) =>
          setFormData({ ...formData, miscellaneous_expense: text })
        }
      />

      {/* Notes */}
      <Text className="text-black mb-1 font-medium">Notes</Text>
      <TextInput
        multiline
        numberOfLines={3}
        className="border border-gray-400 rounded-lg p-3 bg-gray-50 text-black mb-6"
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
      />

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-black p-4 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">Add Trip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
