import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Plus, Edit, Trash2 } from "lucide-react-native";

interface Truck {
  id: string;
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  ownerName: string;
  containerDimension: string;
  loadingCapacity: string;
}

export default function TrucksManager() {
  const [trucks, setTrucks] = useState<Truck[]>([
    {
      id: "1",
      registrationNumber: "MH-01-AB-1234",
      chassisNumber: "CH123456789",
      engineNumber: "EN987654321",
      ownerName: "Rajesh Transport Co.",
      containerDimension: "20x8x8 ft",
      loadingCapacity: "25",
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Truck, "id">>({
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    ownerName: "",
    containerDimension: "",
    loadingCapacity: "",
  });

  const handleSubmit = () => {
    setTrucks([...trucks, { ...formData, id: Date.now().toString() }]);
    setIsOpen(false);
    setFormData({
      registrationNumber: "",
      chassisNumber: "",
      engineNumber: "",
      ownerName: "",
      containerDimension: "",
      loadingCapacity: "",
    });
  };

  return (
    <ScrollView className="flex-1 bg-background p-4 space-y-4">
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="bg-primary py-3 rounded-lg flex-row justify-center items-center"
      >
        <Plus color="white" size={18} />
        <Text className="text-primary-foreground ml-2 font-semibold">Add Truck</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={isOpen} animationType="slide">
        <ScrollView className="flex-1 bg-card p-5">
          <Text className="text-xl font-semibold text-foreground mb-4">Add New Truck</Text>

          {Object.keys(formData).map((key) => (
            <View key={key} className="mb-3">
              <Text className="text-muted-foreground mb-1 capitalize">{key.replace(/([A-Z])/g, " $1")}</Text>
              <TextInput
                className="border border-border rounded-lg p-3 text-foreground bg-background"
                value={(formData as any)[key]}
                onChangeText={(val) => setFormData({ ...formData, [key]: val })}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-primary p-3 rounded-lg mt-2"
          >
            <Text className="text-center text-primary-foreground font-semibold">Add Truck</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsOpen(false)}
            className="mt-4 p-3 border border-border rounded-lg"
          >
            <Text className="text-center text-muted-foreground font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {trucks.map((truck) => (
        <View key={truck.id} className="bg-card border border-border rounded-lg p-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-primary">{truck.registrationNumber}</Text>
            <View className="flex-row gap-3">
              <Edit color="#666" size={20} />
              <Trash2 color="#666" size={20} />
            </View>
          </View>

          <View className="grid-cols-2 gap-2">
            <Text className="text-muted-foreground">Owner: {truck.ownerName}</Text>
            <Text className="text-muted-foreground">Chassis: {truck.chassisNumber}</Text>
            <Text className="text-muted-foreground">Engine: {truck.engineNumber}</Text>
            <Text className="text-muted-foreground">
              Capacity: {truck.loadingCapacity} tons
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
