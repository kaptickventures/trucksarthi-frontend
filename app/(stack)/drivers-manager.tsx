import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { ArrowLeft, Edit3, FileText, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import useDrivers from "../../hooks/useDriver";

export default function DriversManager() {
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { drivers, loading, fetchDrivers, addDriver, updateDriver, deleteDriver } =
    useDrivers(firebase_uid || "");

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    driver_name: "",
    contact_number: "",
    identity_card_url: "",
    license_card_url: "",
  });

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchDrivers();
    }, [firebase_uid, fetchDrivers])
  );

  const handleSubmit = async () => {
    if (!formData.driver_name || !formData.contact_number) {
      return Alert.alert("Validation", "Please fill all required fields");
    }
    try {
      if (editingId) {
        await updateDriver(editingId, formData);
        Alert.alert("Success", "Driver updated successfully!");
      } else {
        await addDriver(formData);
        Alert.alert("Success", "Driver added successfully!");
      }
      setFormData({
        driver_name: "",
        contact_number: "",
        identity_card_url: "",
        license_card_url: "",
      });
      setEditingId(null);
      setIsOpen(false);
      fetchDrivers();
    } catch (err) {
      Alert.alert("Error", "Failed to save driver");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this driver?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDriver(id) },
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


      {/* Main content */}
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 50 }}>
        <TouchableOpacity
          onPress={() => {
            setEditingId(null);
            setFormData({
              driver_name: "",
              contact_number: "",
              identity_card_url: "",
              license_card_url: "",
            });
            setIsOpen(true);
          }}
          className="bg-primary py-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-primary-foreground ml-2 font-semibold">Add Driver</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : drivers.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">No drivers found.</Text>
        ) : (
          drivers.map((driver) => (
            <View
              key={driver.driver_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-card-foreground">
                  {driver.driver_name}
                </Text>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => {
                      setFormData({
                        driver_name: driver.driver_name,
                        contact_number: driver.contact_number,
                        identity_card_url: driver.identity_card_url || "",
                        license_card_url: driver.license_card_url || "",
                      });
                      setEditingId(driver.driver_id);
                      setIsOpen(true);
                    }}
                    className="mr-3"
                  >
                    <Edit3 color="#999" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(driver.driver_id)}>
                    <Trash2 color="#999" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-muted-foreground mb-1">📞 {driver.contact_number}</Text>
              <View className="flex-row items-center mb-1">
                <FileText color="#777" size={18} />
                <Text className="ml-2 text-muted-foreground">
                  Identity Card: {driver.identity_card_url || "Not uploaded"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <FileText color="#777" size={18} />
                <Text className="ml-2 text-muted-foreground">
                  License Card: {driver.license_card_url || "Not uploaded"}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Driver Modal */}
      <Modal visible={isOpen} animationType="slide">
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mr-3">
              <ArrowLeft color="#888" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Driver" : "Add New Driver"}
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
                {editingId ? "Update Driver" : "Save Driver"}
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
