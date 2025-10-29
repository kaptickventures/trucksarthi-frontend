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
} from "react-native";
import { Plus, Trash2, MapPin, ArrowLeft } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useLocations from "../../hooks/useLocation";

export default function LocationsManager() {
  const navigation = useNavigation();
  const userId = 1;
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
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft color="#888" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Locations</Text>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="bg-primary py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-primary-foreground ml-2 font-semibold">Add Location</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : locations.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No locations found.</Text>
        ) : (
          locations.map((loc) => (
            <View
              key={loc.location_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center">
                  <MapPin color="#777" size={18} />
                  <Text className="ml-2 text-lg font-semibold text-card-foreground">
                    {loc.location_name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(loc.location_id)}>
                  <Trash2 color="#999" size={20} />
                </TouchableOpacity>
              </View>
              <Text className="text-muted-foreground">{loc.complete_address}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#888" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">Add New Location</Text>
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
                Save Location
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
