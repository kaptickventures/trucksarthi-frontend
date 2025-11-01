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
  StatusBar,
} from "react-native";
import { Plus, Trash2, ArrowLeft, Edit3 } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import useClients from "../../hooks/useClient";

export default function ClientsManager() {
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { clients, loading, fetchClients, addClient, updateClient, deleteClient } =
    useClients(firebase_uid || "");

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchClients();
    }, [firebase_uid, fetchClients])
  );

  const handleSubmit = async () => {
    if (!formData.client_name || !formData.contact_number) {
      return Alert.alert("Validation", "Please fill all required fields");
    }

    try {
      if (editingId) {
        await updateClient(editingId, formData);
        Alert.alert("Success", "Client updated successfully!");
      } else {
        await addClient(formData);
        Alert.alert("Success", "Client added successfully!");
      }

      setFormData({
        client_name: "",
        contact_person_name: "",
        contact_number: "",
        alternate_contact_number: "",
        email_address: "",
        office_address: "",
      });
      setEditingId(null);
      setIsOpen(false);
    } catch (err) {
      Alert.alert("Error", "Failed to save client");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this client?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteClient(id) },
    ]);
  };

  const handleEdit = (client: any) => {
    setFormData({
      client_name: client.client_name,
      contact_person_name: client.contact_person_name,
      contact_number: client.contact_number,
      alternate_contact_number: client.alternate_contact_number || "",
      email_address: client.email_address,
      office_address: client.office_address,
    });
    setEditingId(client.client_id);
    setIsOpen(true);
  };

  if (!firebase_uid)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-2 text-muted-foreground">Loading user...</Text>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft color="#888" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Clients</Text>
      </View>

      {/* Client List */}
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => {
            setFormData({
              client_name: "",
              contact_person_name: "",
              contact_number: "",
              alternate_contact_number: "",
              email_address: "",
              office_address: "",
            });
            setEditingId(null);
            setIsOpen(true);
          }}
          className="bg-primary py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-primary-foreground ml-2 font-semibold">Add Client</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : clients.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No clients found.</Text>
        ) : (
          clients.map((client) => (
            <View
              key={client.client_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-card-foreground">
                  {client.client_name}
                </Text>
                <View className="flex-row space-x-3 gap-2">
                  <TouchableOpacity onPress={() => handleEdit(client)}>
                    <Edit3 color="#999" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(client.client_id)}>
                    <Trash2 color="#999" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-muted-foreground mb-1">
                👤 {client.contact_person_name || "N/A"}
              </Text>
              <Text className="text-muted-foreground mb-1">
                📞 {client.contact_number}
              </Text>
              {client.alternate_contact_number && (
                <Text className="text-muted-foreground mb-1">
                  📱 {client.alternate_contact_number}
                </Text>
              )}
              <Text className="text-muted-foreground mb-1">
                ✉️ {client.email_address}
              </Text>
              <Text className="text-muted-foreground">🏢 {client.office_address}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#888" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Client" : "Add New Client"}
            </Text>
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
                {editingId ? "Update Client" : "Save Client"}
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
