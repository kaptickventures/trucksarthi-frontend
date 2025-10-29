import React, { useState } from "react";
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
  StatusBar,
} from "react-native";
import { Plus, Trash2, Truck, ArrowLeft } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useTrucks from "../../hooks/useTruck";

export default function TrucksManager() {
  const navigation = useNavigation();
  const userId = 1; // replace with logged-in user ID
  const { trucks, loading, fetchTrucks, addTruck, deleteTruck } = useTrucks(userId);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

  useFocusEffect(React.useCallback(() => { fetchTrucks(); }, [fetchTrucks]));

  const handleSubmit = async () => {
    if (!formData.registration_number || !formData.registered_owner_name)
      return Alert.alert("Validation", "Please fill all required fields");

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
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTruck(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-black">Trucks</Text>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="bg-black py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-white ml-2 font-semibold">Add Truck</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : trucks.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">No trucks found.</Text>
        ) : (
          trucks.map((truck) => (
            <View key={truck.truck_id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center">
                  <Truck color="#333" size={18} />
                  <Text className="ml-2 text-lg font-semibold text-black">
                    {truck.registration_number}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(truck.truck_id)}>
                  <Trash2 color="#666" size={20} />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 mb-1">Owner: {truck.registered_owner_name}</Text>
              <Text className="text-gray-700 mb-1">Chassis: {truck.chassis_number}</Text>
              <Text className="text-gray-700 mb-1">Engine: {truck.engine_number}</Text>
              <Text className="text-gray-700 mb-1">Dimension: {truck.container_dimension}</Text>
              <Text className="text-gray-700">Capacity: {truck.loading_capacity} tons</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#000" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-black">Add New Truck</Text>
          </View>

          <ScrollView className="p-5">
            {Object.keys(formData).map((key) => (
              <View key={key} className="mb-4">
                <Text className="mb-1 text-gray-700 font-medium capitalize">
                  {key.replaceAll("_", " ")}
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl p-3 text-black"
                  value={(formData as any)[key]}
                  onChangeText={(val) => setFormData({ ...formData, [key]: val })}
                />
              </View>
            ))}

            <TouchableOpacity onPress={handleSubmit} className="bg-black p-4 rounded-2xl mt-2">
              <Text className="text-center text-white font-semibold text-base">Save Truck</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsOpen(false)} className="mt-5 p-4 border border-gray-300 rounded-2xl">
              <Text className="text-center text-gray-600 font-medium text-base">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
