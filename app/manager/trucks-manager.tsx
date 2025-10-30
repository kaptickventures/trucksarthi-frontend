import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Plus, Trash2, Truck, ArrowLeft } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import useTrucks from "../../hooks/useTruck";

export default function TrucksManager() {
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { trucks, loading, fetchTrucks, addTruck, deleteTruck } = useTrucks(firebase_uid || "");

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

  // Fetch trucks when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchTrucks();
    }, [firebase_uid, fetchTrucks])
  );

  // Add truck
  const handleSubmit = async () => {
    if (!formData.registration_number || !formData.registered_owner_name)
      return Alert.alert("Validation", "Please fill all required fields");

    try {
      await addTruck(formData);
      setFormData({
        registration_number: "",
        chassis_number: "",
        engine_number: "",
        registered_owner_name: "",
        container_dimension: "",
        loading_capacity: "",
      });
      setIsOpen(false);
      Alert.alert("Success", "Truck added successfully");
    } catch {
      Alert.alert("Error", "Failed to add truck");
    }
  };

  // Delete truck
  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTruck(id) },
    ]);
  };

  if (!firebase_uid)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-3 text-gray-500">Loading user...</Text>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft color="#888" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Trucks</Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="bg-primary py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-primary-foreground ml-2 font-semibold">Add Truck</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : trucks.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No trucks found.</Text>
        ) : (
          trucks.map((truck) => (
            <View
              key={truck.truck_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center">
                  <Truck color="#888" size={18} />
                  <Text className="ml-2 text-lg font-semibold text-card-foreground">
                    {truck.registration_number}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(truck.truck_id)}>
                  <Trash2 color="#999" size={20} />
                </TouchableOpacity>
              </View>

              <Text className="text-muted-foreground mb-1">
                🧍 Owner: {truck.registered_owner_name}
              </Text>
              <Text className="text-muted-foreground mb-1">
                🪧 Chassis: {truck.chassis_number || "N/A"}
              </Text>
              <Text className="text-muted-foreground mb-1">
                ⚙️ Engine: {truck.engine_number || "N/A"}
              </Text>
              <Text className="text-muted-foreground mb-1">
                📦 Dimension: {truck.container_dimension || "N/A"}
              </Text>
              <Text className="text-muted-foreground">
                🚚 Capacity: {truck.loading_capacity || "N/A"}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Adding a Truck */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#888" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">Add New Truck</Text>
          </View>

          <ScrollView className="p-5">
            {Object.keys(formData).map((key) => (
              <View key={key} className="mb-4">
                <Text className="mb-1 text-muted-foreground font-medium capitalize">
                  {key.replaceAll("_", " ")}
                </Text>
                <TextInput
                  className="border border-input rounded-xl p-3 bg-input-bg text-input-text"
                  value={(formData as any)[key]}
                  onChangeText={(val) => setFormData({ ...formData, [key]: val })}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-primary p-4 rounded-2xl mt-2"
            >
              <Text className="text-center text-primary-foreground font-semibold text-base">
                Save Truck
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              className="mt-5 p-4 border border-border rounded-2xl"
            >
              <Text className="text-center text-muted-foreground font-medium text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
