import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Plus, Edit, Trash2, FileText } from "lucide-react-native";

interface Driver {
  id: string;
  name: string;
  contactNumber: string;
  identityCard: string;
  licenseCard: string;
}

export default function DriversManager() {
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "1",
      name: "Rajesh Kumar",
      contactNumber: "+91 98765 43210",
      identityCard: "Aadhaar uploaded",
      licenseCard: "License uploaded",
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Driver, "id">>({
    name: "",
    contactNumber: "",
    identityCard: "",
    licenseCard: "",
  });

  const handleSubmit = () => {
    setDrivers([...drivers, { ...formData, id: Date.now().toString() }]);
    setIsOpen(false);
    setFormData({ name: "", contactNumber: "", identityCard: "", licenseCard: "" });
  };

  return (
    <ScrollView className="flex-1 bg-background p-4 space-y-4">
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="bg-primary py-3 rounded-lg flex-row justify-center items-center"
      >
        <Plus color="white" size={18} />
        <Text className="text-primary-foreground ml-2 font-semibold">Add Driver</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide">
        <ScrollView className="flex-1 bg-card p-5">
          <Text className="text-xl font-semibold text-foreground mb-4">Add New Driver</Text>
          {Object.keys(formData).map((key) => (
            <View key={key} className="mb-3">
              <Text className="text-muted-foreground mb-1 capitalize">{key}</Text>
              <TextInput
                className="border border-border rounded-lg p-3 text-foreground bg-background"
                value={(formData as any)[key]}
                onChangeText={(val) => setFormData({ ...formData, [key]: val })}
              />
            </View>
          ))}
          <TouchableOpacity onPress={handleSubmit} className="bg-primary p-3 rounded-lg">
            <Text className="text-center text-primary-foreground font-semibold">Add Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsOpen(false)} className="mt-4 p-3 border border-border rounded-lg">
            <Text className="text-center text-muted-foreground font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {drivers.map((driver) => (
        <View key={driver.id} className="bg-card border border-border rounded-lg p-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="font-semibold text-lg text-foreground">{driver.name}</Text>
            <View className="flex-row gap-2">
              <Edit color="#666" size={20} />
              <Trash2 color="#666" size={20} />
            </View>
          </View>
          <Text className="text-primary mb-1">{driver.contactNumber}</Text>
          <View className="flex-row items-center gap-2 mb-1">
            <FileText color="#888" size={18} />
            <Text className="text-muted-foreground">{driver.identityCard}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <FileText color="#888" size={18} />
            <Text className="text-muted-foreground">{driver.licenseCard}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
