import React, { useEffect, useState } from "react";
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
import axios from "axios";

// ✅ Replace this with your backend Render URL
const BACKEND_URL = "https://your-backend-url.onrender.com";

export default function AddTrip() {
  const userId = 1; // your logged-in user_id
  const [loading, setLoading] = useState(true);

  // Data from backend
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Form data
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

  // Dropdown open states
  const [dropdowns, setDropdowns] = useState({
    truck: false,
    driver: false,
    client: false,
    start: false,
    end: false,
  });

  // ✅ Fetch data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, d, c, l] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/trucks/user/${userId}`),
          axios.get(`${BACKEND_URL}/api/drivers/user/${userId}`),
          axios.get(`${BACKEND_URL}/api/clients/user/${userId}`),
          axios.get(`${BACKEND_URL}/api/locations/user/${userId}`),
        ]);
        setTrucks(t.data);
        setDrivers(d.data);
        setClients(c.data);
        setLocations(l.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        Alert.alert("Error", "Unable to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      const res = await axios.post(`${BACKEND_URL}/api/trips`, {
        truck_id: Number(truck_id),
        driver_id: Number(driver_id),
        client_id: Number(client_id),
        start_location_id: Number(start_location_id),
        end_location_id: Number(end_location_id),
        cost_of_trip: Number(cost_of_trip),
        miscellaneous_expense: Number(formData.miscellaneous_expense || 0),
        notes: formData.notes,
      });

      console.log("Trip added:", res.data);
      Alert.alert("Success", "Trip created successfully!");

      // Reset form after submission
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
    } catch (err: any) {
      console.error("Error adding trip:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to create trip. Please check your inputs.");
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

  // ✅ Dropdown configurations
  const dropdownData = [
    {
      label: "Truck",
      key: "truck_id",
      openKey: "truck",
      items: trucks.map((t) => ({
        label: t.registration_number,
        value: t.truck_id,
      })),
    },
    {
      label: "Driver",
      key: "driver_id",
      openKey: "driver",
      items: drivers.map((d) => ({ label: d.name, value: d.driver_id })),
    },
    {
      label: "Client",
      key: "client_id",
      openKey: "client",
      items: clients.map((c) => ({
        label: c.client_name,
        value: c.client_id,
      })),
    },
    {
      label: "Start Location",
      key: "start_location_id",
      openKey: "start",
      items: locations.map((l) => ({
        label: l.location_name,
        value: l.location_id,
      })),
    },
    {
      label: "End Location",
      key: "end_location_id",
      openKey: "end",
      items: locations.map((l) => ({
        label: l.location_name,
        value: l.location_id,
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
