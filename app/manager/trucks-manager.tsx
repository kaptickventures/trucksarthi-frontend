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
  const [form, setForm] = useState({
    truck_number: "",
    truck_type: "",
    capacity: "",
  });

  const resetForm = () => setForm({ truck_number: "", truck_type: "", capacity: "" });

  const handleSubmit = async () => {
    if (!form.truck_number || !form.truck_type) {
      Alert.alert("Validation", "Please fill all required fields");
      return;
    }

    try {
      await addTruck(form);
      resetForm();
      setIsOpen(false);
      Alert.alert("Truck added successfully");
    } catch {
      Alert.alert("Failed to add truck");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTruck(id) },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchTrucks();
    }, [firebase_uid, fetchTrucks])
  );

  if (!firebase_uid)
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#888" />
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
          <Text className="text-center text-muted-foreground mt-10">
            No trucks found.
          </Text>
        ) : (
          trucks.map((truck) => (
            <View
              key={truck.truck_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center">
                  <Truck color="#888" size={18} />
                </View>
                <TouchableOpacity onPress={() => handleDelete(truck.truck_id)}>
                  <Trash2 color="#999" size={20} />
                </TouchableOpacity>
              </View>

              
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add Truck */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#888" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">Add New Truck</Text>
          </View>

          <ScrollView className="p-5">
            {Object.keys(form).map((key) => (
              <View key={key} className="mb-4">
                <Text className="mb-1 text-muted-foreground font-medium capitalize">
                  {key.replaceAll("_", " ")}
                </Text>
                <TextInput
                  className="border border-input rounded-xl p-3 bg-input-bg text-input-text"
                  placeholder={key.replaceAll("_", " ")}
                  value={(form as any)[key]}
                  onChangeText={(val) => setForm({ ...form, [key]: val })}
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
