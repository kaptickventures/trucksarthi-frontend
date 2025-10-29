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
import { Plus, Trash2, MapPin, ArrowLeft } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useLocations from "../../hooks/useLocation";

export default function LocationsManager() {
  const navigation = useNavigation();
  const userId = 1; // replace with actual logged-in user id
  const { locations, loading, fetchLocations, addLocation, deleteLocation } = useLocations(userId);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    location_name: "",
    complete_address: "",
  });

  useFocusEffect(React.useCallback(() => { fetchLocations(); }, [fetchLocations]));

  const handleSubmit = async () => {
    if (!formData.location_name || !formData.complete_address)
      return Alert.alert("Validation", "Please fill all fields");

    await addLocation(formData);
    setFormData({ location_name: "", complete_address: "" });
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this location?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteLocation(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-black">Locations</Text>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="bg-black py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-white ml-2 font-semibold">Add Location</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : locations.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">No locations found.</Text>
        ) : (
          locations.map((loc) => (
            <View key={loc.location_id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center">
                  <MapPin color="#333" size={18} />
                  <Text className="ml-2 text-lg font-semibold text-black">{loc.location_name}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(loc.location_id)}>
                  <Trash2 color="#666" size={20} />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700">{loc.complete_address}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#000" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-black">Add New Location</Text>
          </View>

          <ScrollView className="p-5">
            <View className="mb-4">
              <Text className="mb-1 text-gray-700 font-medium">Location Name</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-3 text-black"
                value={formData.location_name}
                onChangeText={(val) => setFormData({ ...formData, location_name: val })}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-gray-700 font-medium">Complete Address</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-3 text-black"
                value={formData.complete_address}
                onChangeText={(val) => setFormData({ ...formData, complete_address: val })}
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} className="bg-black p-4 rounded-2xl mt-2">
              <Text className="text-center text-white font-semibold text-base">Save Location</Text>
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
