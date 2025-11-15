import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";

import useClients from "../../hooks/useClient";

export default function ClientsManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { clients, loading, fetchClients, addClient, updateClient, deleteClient } =
    useClients(firebase_uid || "");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });

  // BottomSheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["35%", "65%"], []);

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchClients();
    }, [firebase_uid, fetchClients])
  );

  const openSheet = (editing = false, data?: any) => {
    if (editing && data) {
      setEditingId(data.client_id);
      setFormData({
        client_name: data.client_name || "",
        contact_person_name: data.contact_person_name || "",
        contact_number: data.contact_number || "",
        alternate_contact_number: data.alternate_contact_number || "",
        email_address: data.email_address || "",
        office_address: data.office_address || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        client_name: "",
        contact_person_name: "",
        contact_number: "",
        alternate_contact_number: "",
        email_address: "",
        office_address: "",
      });
    }
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => bottomSheetRef.current?.close();

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
      closeSheet();
      fetchClients();
    } catch {
      Alert.alert("Error", "Failed to save client");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this client?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteClient(id) },
    ]);
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

      {/* Client List */}
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : clients.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No clients found.</Text>
        ) : (
          clients.map((client) => (
            <View
              key={client.client_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center"
            >
              {/* LEFT SIDE */}
              <View className="flex-row items-start flex-1">
                <View className="p-2 bg-secondary rounded-xl mr-3">
                  <MapPin size={18} color="#2563EB" />
                </View>

                <View className="flex-1">
                  <Text className="text-card-foreground font-semibold text-base">
                    {client.client_name}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    {client.contact_person_name || "N/A"}
                  </Text>
                </View>
              </View>

              {/* RIGHT SIDE ICONS */}
              <View className="flex-row items-center ml-3">
                <TouchableOpacity onPress={() => openSheet(true, client)} className="p-2">
                  <Edit3 size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(client.client_id)} className="p-2">
                  <Trash2 size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => openSheet(false)}
        className="absolute bottom-8 right-6 bg-primary w-16 h-16 rounded-full justify-center items-center"
        style={{
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints}>
        <View className="px-5 py-3">
          <Text className="text-xl font-semibold text-foreground mb-4">
            {editingId ? "Edit Client" : "Add Client"}
          </Text>

          {Object.keys(formData).map((key) => (
            <View key={key} className="mb-4">
              <Text className="text-muted-foreground mb-1 font-medium capitalize">
                {key.replaceAll("_", " ")}
              </Text>
              <TextInput
                className="border border-input rounded-xl p-3 mb-0"
                value={(formData as any)[key]}
                onChangeText={(val) => setFormData({ ...formData, [key]: val })}
              />
            </View>
          ))}

          <TouchableOpacity onPress={handleSubmit} className="bg-primary p-4 rounded-xl">
            <Text className="text-center text-primary-foreground font-semibold">
              {editingId ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={closeSheet} className="border border-border p-4 rounded-xl mt-3">
            <Text className="text-center text-muted-foreground">Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
