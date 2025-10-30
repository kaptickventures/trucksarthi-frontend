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
import useDrivers from "../../hooks/useDriver";
import { getAuth } from "firebase/auth";

export default function DriversManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;
  const { drivers, loading, fetchDrivers, addDriver, deleteDriver } = useDrivers(firebase_uid || "");

  const [form, setForm] = useState({
    driver_name: "",
    license_number: "",
    contact_number: "",
    address: "",
  });

  const resetForm = () =>
    setForm({
      driver_name: "",
      license_number: "",
      contact_number: "",
      address: "",
    });

  const handleSubmit = async () => {
    if (!form.driver_name || !form.license_number) {
      Alert.alert("Please fill all required fields");
      return;
    }
    try {
      await addDriver(form);
      resetForm();
      Alert.alert("Driver added successfully");
    } catch {
      Alert.alert("Failed to add driver");
    }
  };

  const handleDelete = (id: number) =>
    Alert.alert("Confirm", "Delete this driver?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => deleteDriver(id) },
    ]);

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchDrivers();
    }, [firebase_uid, fetchDrivers])
  );

  if (!firebase_uid) return <ActivityIndicator size="large" color="#888" />;

  return (
    <ScrollView className="p-4">
      {loading && <ActivityIndicator />}
      <Text className="text-xl font-bold mb-2">Add Driver</Text>

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
        <Text className="text-white text-center">Add Driver</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold mt-4 mb-2">Drivers List</Text>
      {drivers.map((driver) => (
        <View key={driver.driver_id} className="border p-2 mb-2 rounded">
          <Text>{driver.driver_name}</Text>
          <TouchableOpacity onPress={() => handleDelete(driver.driver_id)}>
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
