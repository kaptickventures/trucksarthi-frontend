import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Edit3, Trash2 } from "lucide-react-native";
import { getAuth } from "firebase/auth";
import "../../global.css";

type Truck = {
  truck_id: number;
  firebase_uid: string;
  registration_number: string;
  chassis_number?: string;
  engine_number?: string;
  registered_owner_name: string;
  container_dimension?: string;
  loading_capacity?: string | number;
};

type TruckForm = {
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  registered_owner_name: string;
  container_dimension: string;
  loading_capacity: string | number;
};

export default function TrucksManager() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TruckForm>({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch trucks
  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/trucks`);
      const data = await res.json();
      setTrucks(data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch trucks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  // Handle create/update
  const handleSubmit = async () => {
    if (!formData.registration_number || !formData.registered_owner_name) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const url = editingId
        ? `${process.env.EXPO_PUBLIC_API_URL}/trucks/${editingId}`
        : `${process.env.EXPO_PUBLIC_API_URL}/trucks`;

      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        firebase_uid: user?.uid,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert("Success", editingId ? "Truck updated" : "Truck added");
        fetchTrucks();
        setIsOpen(false);
        setEditingId(null);
        setFormData({
          registration_number: "",
          chassis_number: "",
          engine_number: "",
          registered_owner_name: "",
          container_dimension: "",
          loading_capacity: "",
        });
      } else {
        Alert.alert("Error", "Failed to save truck");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    Alert.alert("Confirm", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/trucks/${id}`,
              { method: "DELETE" }
            );
            if (res.ok) {
              fetchTrucks();
              Alert.alert("Deleted", "Truck removed successfully");
            } else {
              Alert.alert("Error", "Failed to delete truck");
            }
          } catch {
            Alert.alert("Error", "Something went wrong");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-4 text-primary">Manage Trucks</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <ScrollView className="flex-1">
            {trucks.map((truck) => (
              <View
                key={truck.truck_id}
                className="p-4 mb-3 rounded-2xl bg-card shadow-sm flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-lg font-semibold text-primary">
                    {truck.registration_number}
                  </Text>
                  <Text className="text-sm text-secondary">
                    Owner: {truck.registered_owner_name}
                  </Text>
                  <Text className="text-sm text-muted">
                    Capacity: {truck.loading_capacity || "N/A"}
                  </Text>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => {
                      setFormData({
                        registration_number: truck.registration_number,
                        chassis_number: truck.chassis_number || "",
                        engine_number: truck.engine_number || "",
                        registered_owner_name: truck.registered_owner_name,
                        container_dimension: truck.container_dimension || "",
                        loading_capacity: String(truck.loading_capacity || ""),
                      });
                      setEditingId(truck.truck_id);
                      setIsOpen(true);
                    }}
                    className="mr-3"
                  >
                    <Edit3 color="#999" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(truck.truck_id)}>
                    <Trash2 color="#FF3B30" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => {
          setFormData({
            registration_number: "",
            chassis_number: "",
            engine_number: "",
            registered_owner_name: "",
            container_dimension: "",
            loading_capacity: "",
          });
          setEditingId(null);
          setIsOpen(true);
        }}
        className="absolute bottom-6 right-6 bg-primary rounded-full p-4 shadow-lg"
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      {/* Modal for Add/Edit */}
      <Modal visible={isOpen} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="w-full bg-card rounded-2xl p-5">
            <Text className="text-xl font-semibold mb-4 text-primary">
              {editingId ? "Edit Truck" : "Add Truck"}
            </Text>

            {Object.keys(formData).map((key) => (
              <TextInput
                key={key}
                className="border border-input rounded-xl p-3 mb-3 bg-input-bg text-input-text"
                placeholder={key.replace(/_/g, " ").toUpperCase()}
                value={String((formData as any)[key] ?? "")}
                onChangeText={(val) => setFormData({ ...formData, [key]: val })}
              />
            ))}

            <View className="flex-row justify-end mt-3">
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-300 mr-3"
              >
                <Text className="text-black font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                className="px-4 py-2 rounded-xl bg-primary"
              >
                <Text className="text-white font-medium">
                  {editingId ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
