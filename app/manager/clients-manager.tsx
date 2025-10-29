// src/screens/ClientsManager.tsx
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
import { Plus, Trash2, ArrowLeft } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useClients from "../../hooks/useClient";


export default function ClientsManager() {
  const navigation = useNavigation();
  const userId = 1; 

  const { clients, loading, fetchClients, addClient, deleteClient } =
    useClients(userId);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });

  // 🔁 Automatically refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchClients();
    }, [fetchClients])
  );

  const handleSubmit = async () => {
    if (!formData.client_name || !formData.contact_number) {
      return Alert.alert("Validation", "Please fill all required fields");
    }

    await addClient(formData);
    setFormData({
      client_name: "",
      contact_person_name: "",
      contact_number: "",
      alternate_contact_number: "",
      email_address: "",
      office_address: "",
    });
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this client?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteClient(id),
      },
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
        <Text className="text-lg font-semibold text-black">Clients</Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="bg-black py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-white ml-2 font-semibold">Add Client</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : clients.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No clients found for this user.
          </Text>
        ) : (
          clients.map((client) => (
            <View
              key={client.client_id}
              className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-black">
                  {client.client_name}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(client.client_id)}>
                  <Trash2 color="#666" size={20} />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-700 mb-1">
                👤 {client.contact_person_name || "N/A"}
              </Text>
              <Text className="text-gray-700 mb-1">
                📞 {client.contact_number}
              </Text>
              {client.alternate_contact_number && (
                <Text className="text-gray-600 mb-1">
                  📱 {client.alternate_contact_number}
                </Text>
              )}
              <Text className="text-gray-600 mb-1">
                ✉️ {client.email_address}
              </Text>
              <Text className="text-gray-600">🏢 {client.office_address}</Text>
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
            <Text className="text-lg font-semibold text-black">
              Add New Client
            </Text>
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
                  onChangeText={(val) =>
                    setFormData({ ...formData, [key]: val })
                  }
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-black p-4 rounded-2xl mt-2"
            >
              <Text className="text-center text-white font-semibold text-base">
                Save Client
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              className="mt-5 p-4 border border-gray-300 rounded-2xl"
            >
              <Text className="text-center text-gray-600 font-medium text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
