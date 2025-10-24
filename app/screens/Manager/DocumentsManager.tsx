import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Plus, Edit, Trash2 } from "lucide-react-native";

interface Client {
  id: string;
  name: string;
  contactPerson: string;
  contactNumber: string;
  alternateNumber?: string;
  email: string;
  address: string;
}

export default function DocumentManager() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: "1",
      name: "ABC Logistics",
      contactPerson: "Amit Sharma",
      contactNumber: "+91 98765 12345",
      email: "contact@abclogistics.com",
      address: "Mumbai, Maharashtra",
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Client, "id">>({
    name: "",
    contactPerson: "",
    contactNumber: "",
    alternateNumber: "",
    email: "",
    address: "",
  });

  const handleSubmit = () => {
    setClients([...clients, { ...formData, id: Date.now().toString() }]);
    setIsOpen(false);
    setFormData({
      name: "",
      contactPerson: "",
      contactNumber: "",
      alternateNumber: "",
      email: "",
      address: "",
    });
  };

  return (
    <ScrollView className="flex-1 bg-background p-4 space-y-4">
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="bg-primary py-3 rounded-lg flex-row justify-center items-center"
      >
        <Plus color="white" size={18} />
        <Text className="text-primary-foreground ml-2 font-semibold">Add Client</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide">
        <ScrollView className="flex-1 bg-card p-5">
          <Text className="text-xl font-semibold text-foreground mb-4">Add New Client</Text>

          {Object.keys(formData).map((key) => (
            <View key={key} className="mb-3">
              <Text className="text-muted-foreground mb-1 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </Text>
              <TextInput
                className="border border-border rounded-lg p-3 text-foreground bg-background"
                value={(formData as any)[key]}
                onChangeText={(val) => setFormData({ ...formData, [key]: val })}
              />
            </View>
          ))}

          <TouchableOpacity onPress={handleSubmit} className="bg-primary p-3 rounded-lg">
            <Text className="text-center text-primary-foreground font-semibold">Add Client</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsOpen(false)} className="mt-4 p-3 border border-border rounded-lg">
            <Text className="text-center text-muted-foreground font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {clients.map((client) => (
        <View key={client.id} className="bg-card border border-border rounded-lg p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="font-semibold text-lg text-foreground">{client.name}</Text>
            <View className="flex-row gap-2">
              <Edit color="#666" size={20} />
              <Trash2 color="#666" size={20} />
            </View>
          </View>

          <Text className="text-muted-foreground">Contact: {client.contactPerson}</Text>
          <Text className="text-primary">{client.contactNumber}</Text>
          <Text className="text-muted-foreground">{client.email}</Text>
          <Text className="text-muted-foreground">{client.address}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
