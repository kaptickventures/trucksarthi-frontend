import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useClients from "../../hooks/useClient";
import { getAuth } from "firebase/auth";

export default function ClientsManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;
  const { clients, loading, fetchClients, addClient, deleteClient } = useClients(firebase_uid || "");

  const [form, setForm] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });

  const resetForm = () =>
    setForm({
      client_name: "",
      contact_person_name: "",
      contact_number: "",
      alternate_contact_number: "",
      email_address: "",
      office_address: "",
    });

  const handleSubmit = async () => {
    if (!form.client_name || !form.contact_person_name || !form.contact_number) {
      Alert.alert("Please fill all required fields");
      return;
    }
    try {
      await addClient(form);
      resetForm();
      Alert.alert("Client added successfully");
    } catch {
      Alert.alert("Failed to add client");
    }
  };

  const handleDelete = (id: number) =>
    Alert.alert("Confirm", "Delete this client?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => deleteClient(id) },
    ]);

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchClients();
    }, [firebase_uid, fetchClients])
  );

  if (!firebase_uid) return <ActivityIndicator size="large" color="#888" />;

  return (
    <ScrollView className="p-4">
      {loading && <ActivityIndicator />}
      <Text className="text-xl font-bold mb-2">Add Client</Text>

      {Object.keys(form).map((key) => (
        <TextInput
          key={key}
          placeholder={key.replace(/_/g, " ")}
          value={(form as any)[key]}
          onChangeText={(text) => setForm((p) => ({ ...p, [key]: text }))}
          className="border p-2 mb-2 rounded"
        />
      ))}

      <TouchableOpacity onPress={handleSubmit} className="bg-blue-500 p-3 rounded">
        <Text className="text-white text-center">Add Client</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold mt-4 mb-2">Clients List</Text>
      {clients.map((client) => (
        <View key={client.client_id} className="border p-2 mb-2 rounded">
          <Text>{client.client_name}</Text>
          <TouchableOpacity onPress={() => handleDelete(client.client_id)}>
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
