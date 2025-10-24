import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Plus, Edit, Trash2, MapPin } from "lucide-react-native";

interface Location {
  id: string;
  name: string;
  address: string;
}

export default function LocationsManager() {
  const [locations, setLocations] = useState<Location[]>([
    { id: "1", name: "Mumbai", address: "Mumbai, Maharashtra, India" },
    { id: "2", name: "Delhi", address: "New Delhi, Delhi, India" },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Location, "id">>({
    name: "",
    address: "",
  });

  const handleSubmit = () => {
    setLocations([...locations, { ...formData, id: Date.now().toString() }]);
    setIsOpen(false);
    setFormData({ name: "", address: "" });
  };

  return (
    <ScrollView className="flex-1 bg-background p-4 space-y-4">
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="bg-primary py-3 rounded-lg flex-row justify-center items-center"
      >
        <Plus color="white" size={18} />
        <Text className="text-primary-foreground ml-2 font-semibold">Add Location</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide">
        <ScrollView className="flex-1 bg-card p-5">
          <Text className="text-xl font-semibold text-foreground mb-4">Add New Location</Text>
          <View className="mb-3">
            <Text className="text-muted-foreground mb-1">Location Name</Text>
            <TextInput
              className="border border-border rounded-lg p-3 text-foreground bg-background"
              value={formData.name}
              onChangeText={(val) => setFormData({ ...formData, name: val })}
            />
          </View>
          <View className="mb-3">
            <Text className="text-muted-foreground mb-1">Address</Text>
            <TextInput
              className="border border-border rounded-lg p-3 text-foreground bg-background"
              value={formData.address}
              onChangeText={(val) => setFormData({ ...formData, address: val })}
              multiline
            />
          </View>

          <TouchableOpacity onPress={handleSubmit} className="bg-primary p-3 rounded-lg">
            <Text className="text-center text-primary-foreground font-semibold">Add Location</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsOpen(false)} className="mt-4 p-3 border border-border rounded-lg">
            <Text className="text-center text-muted-foreground font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {locations.map((location) => (
        <View key={location.id} className="bg-card border border-border rounded-lg p-4 flex-row justify-between items-start">
          <View className="flex-row gap-3 flex-1">
            <MapPin color="#222" size={20} />
            <View>
              <Text className="font-semibold text-foreground">{location.name}</Text>
              <Text className="text-sm text-muted-foreground mt-1">{location.address}</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Edit color="#666" size={20} />
            <Trash2 color="#666" size={20} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
