import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useLocations from "../../hooks/useLocation";
import { getAuth } from "firebase/auth";

export default function LocationsManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;
  const { locations, loading, fetchLocations, addLocation, deleteLocation } = useLocations(firebase_uid || "");

  const [form, setForm] = useState({ location_name: "", address: "" });

  const handleSubmit = async () => {
    if (!form.location_name) {
      Alert.alert("Please fill location name");
      return;
    }
    try {
      await addLocation(form);
      setForm({ location_name: "", address: "" });
      Alert.alert("Location added successfully");
    } catch {
      Alert.alert("Failed to add location");
    }
  };

  const handleDelete = (id: number) =>
    Alert.alert("Confirm", "Delete this location?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => deleteLocation(id) },
    ]);

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchLocations();
    }, [firebase_uid, fetchLocations])
  );

  if (!firebase_uid) return <ActivityIndicator size="large" color="#888" />;

  return (
    <ScrollView className="p-4">
      {loading && <ActivityIndicator />}
      <Text className="text-xl font-bold mb-2">Add Location</Text>

      <TextInput
        placeholder="Location Name"
        value={form.location_name}
        onChangeText={(text) => setForm((p) => ({ ...p, location_name: text }))}
        className="border p-2 mb-2 rounded"
      />
      <TextInput
        placeholder="Address"
        value={form.address}
        onChangeText={(text) => setForm((p) => ({ ...p, address: text }))}
        className="border p-2 mb-2 rounded"
      />

      <TouchableOpacity onPress={handleSubmit} className="bg-blue-500 p-3 rounded">
        <Text className="text-white text-center">Add Location</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold mt-4 mb-2">Locations List</Text>
      {locations.map((loc) => (
        <View key={loc.location_id} className="border p-2 mb-2 rounded">
          <Text>{loc.location_name}</Text>
          <TouchableOpacity onPress={() => handleDelete(loc.location_id)}>
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
