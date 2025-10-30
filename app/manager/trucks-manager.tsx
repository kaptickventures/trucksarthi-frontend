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
import useTrucks from "../../hooks/useTruck";
import { getAuth } from "firebase/auth";

export default function TrucksManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;
  const { trucks, loading, fetchTrucks, addTruck, deleteTruck } = useTrucks(firebase_uid || "");

  const [form, setForm] = useState({
    truck_number: "",
    truck_type: "",
    capacity: "",
  });

  const resetForm = () => setForm({ truck_number: "", truck_type: "", capacity: "" });

  const handleSubmit = async () => {
    if (!form.truck_number || !form.truck_type) {
      Alert.alert("Please fill all required fields");
      return;
    }
    try {
      await addTruck(form);
      resetForm();
      Alert.alert("Truck added successfully");
    } catch {
      Alert.alert("Failed to add truck");
    }
  };

  const handleDelete = (id: number) =>
    Alert.alert("Confirm", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => deleteTruck(id) },
    ]);

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchTrucks();
    }, [firebase_uid, fetchTrucks])
  );

  if (!firebase_uid) return <ActivityIndicator size="large" color="#888" />;

  return (
    <ScrollView className="p-4">
      {loading && <ActivityIndicator />}
      <Text className="text-xl font-bold mb-2">Add Truck</Text>

      {Object.keys(form).map((key) => (
        <TextInput
          key={key}
          placeholder={key.replace(/_/g, " ")}
          value={(form as any)[key]}
          onChangeText={(text) => setForm((p) => ({ ...p, [key]: text }))}
          className="border p-2 mb-2 rounded"
        />
      ))}

      <TouchableOpacity onPress={handleSubmit} className="bg-blue-500 p-3 rounded">
        <Text className="text-white text-center">Add Truck</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold mt-4 mb-2">Trucks List</Text>
      {trucks.map((truck) => (
        <View key={truck.truck_id} className="border p-2 mb-2 rounded">
          <TouchableOpacity onPress={() => handleDelete(truck.truck_id)}>
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
