// app/trucks/TrucksManager.tsx
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { ArrowLeft, Edit3, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import useTrucks from "../../hooks/useTruck";

export default function TrucksManager() {
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { trucks, loading, fetchTrucks, addTruck, updateTruck, deleteTruck } =
    useTrucks(firebase_uid || "");

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

  // Refresh trucks when returning to page
  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchTrucks();
    }, [firebase_uid, fetchTrucks])
  );

  const handleSubmit = async () => {
    if (!formData.registration_number || !formData.registered_owner_name) {
      return Alert.alert("Validation", "Please fill all required fields");
    }

    try {
      if (editingId) {
        await updateTruck(editingId, formData);
        Alert.alert("Success", "Truck updated successfully!");
      } else {
        await addTruck(formData);
        Alert.alert("Success", "Truck added successfully!");
      }

      // Reset form
      setFormData({
        registration_number: "",
        chassis_number: "",
        engine_number: "",
        registered_owner_name: "",
        container_dimension: "",
        loading_capacity: "",
      });
      setEditingId(null);
      setIsOpen(false);
    } catch (err) {
      Alert.alert("Error", "Failed to save truck");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTruck(id) },
    ]);
  };

  const handleEdit = (truck: any) => {
    setFormData({
      registration_number: truck.registration_number,
      chassis_number: truck.chassis_number || "",
      engine_number: truck.engine_number || "",
      registered_owner_name: truck.registered_owner_name,
      container_dimension: truck.container_dimension || "",
      loading_capacity: String(truck.loading_capacity || ""),
    });
    setEditingId(truck.truck_id);
    setIsOpen(true);
  };

  if (!firebase_uid)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-2 text-muted-foreground">Loading user...</Text>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

  
      {/* Truck List */}
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => {
            setFormData({
              registration_number: "",
              chassis_number: "",
              engine_number: "",
              registered_owner_name: "",
              container_dimension: "",
              loading_capacity: "",
            });
            setEditingId(null);
            setIsOpen(true);
          }}
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
                <Text className="text-lg font-semibold text-card-foreground">
                  {truck.registration_number}
                </Text>
                <View className="flex-row gap-2 gap-2">
                  <TouchableOpacity onPress={() => handleEdit(truck)}>
                    <Edit3 color="#999" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(truck.truck_id)}>
                    <Trash2 color="#999" size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-muted-foreground mb-1">
                🚛 Owner: {truck.registered_owner_name}
              </Text>
              {truck.chassis_number && (
                <Text className="text-muted-foreground mb-1">
                  🔩 Chassis: {truck.chassis_number}
                </Text>
              )}
              {truck.engine_number && (
                <Text className="text-muted-foreground mb-1">
                  ⚙️ Engine: {truck.engine_number}
                </Text>
              )}
              {truck.container_dimension && (
                <Text className="text-muted-foreground mb-1">
                  📏 Container: {truck.container_dimension}
                </Text>
              )}
              <Text className="text-muted-foreground">
                🧱 Capacity: {truck.loading_capacity || "N/A"}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#888" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Truck" : "Add New Truck"}
            </Text>
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
                {editingId ? "Update Truck" : "Save Truck"}
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
