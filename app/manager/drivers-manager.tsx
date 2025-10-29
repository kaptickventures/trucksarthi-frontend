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
import { Plus, Trash2, FileText, ArrowLeft } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useDrivers from "../../hooks/useDriver";


export default function DriversManager() {
  const navigation = useNavigation();
  const userId = 1;
  const { drivers, loading, fetchDrivers, addDriver, deleteDriver } = useDrivers(userId);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    driver_name: "",
    contact_number: "",
    identity_card_url: "",
    license_card_url: "",
  });

  useFocusEffect(React.useCallback(() => { fetchDrivers(); }, [fetchDrivers]));

  const handleSubmit = async () => {
    if (!formData.driver_name || !formData.contact_number)
      return Alert.alert("Validation", "Please fill all required fields");

    await addDriver(formData);
    setFormData({ driver_name: "", contact_number: "", identity_card_url: "", license_card_url: "" });
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this driver?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDriver(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-black">Drivers</Text>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="bg-black py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-white ml-2 font-semibold">Add Driver</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : drivers.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">No drivers found.</Text>
        ) : (
          drivers.map((driver) => (
            <View key={driver.driver_id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-black">{driver.driver_name}</Text>
                <TouchableOpacity onPress={() => handleDelete(driver.driver_id)}>
                  <Trash2 color="#666" size={20} />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 mb-1">📞 {driver.contact_number}</Text>
              <View className="flex-row items-center mb-1">
                <FileText color="#777" size={18} />
                <Text className="ml-2 text-gray-600">ID: {driver.identity_card_url || "Not uploaded"}</Text>
              </View>
              <View className="flex-row items-center">
                <FileText color="#777" size={18} />
                <Text className="ml-2 text-gray-600">License: {driver.license_card_url || "Not uploaded"}</Text>
              </View>
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
            <Text className="text-lg font-semibold text-black">Add New Driver</Text>
          </View>

          <ScrollView className="p-5">
            {Object.keys(formData).map((key) => (
              <View key={key} className="mb-4">
                <Text className="mb-1 text-gray-700 font-medium capitalize">{key.replaceAll("_", " ")}</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl p-3 text-black"
                  value={(formData as any)[key]}
                  onChangeText={(val) => setFormData({ ...formData, [key]: val })}
                />
              </View>
            ))}
            <TouchableOpacity onPress={handleSubmit} className="bg-black p-4 rounded-2xl mt-2">
              <Text className="text-center text-white font-semibold text-base">Save Driver</Text>
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
