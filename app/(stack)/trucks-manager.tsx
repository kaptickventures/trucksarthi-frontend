import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import TruckFormModal from "../../components/TruckModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { useUser } from "../../hooks/useUser";

export default function TrucksManager() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { colors, theme } = useThemeStore();

  const {
    trucks,
    loading: trucksLoading,
    fetchTrucks,
    addTruck,
    updateTruck,
    deleteTruck,
  } = useTrucks();

  const loading = userLoading || trucksLoading;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const requiredFields = [
    "registration_number",
    "registered_owner_name",
    "chassis_number",
    "engine_number",
    "container_dimension",
    "loading_capacity",
  ];

  const [formData, setFormData] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

  const insets = useSafeAreaInsets();

  /* ---------------- FETCH ---------------- */
  useFocusEffect(
    useCallback(() => {
      fetchTrucks();
    }, [fetchTrucks])
  );

  /* ---------------- MODAL ---------------- */
  const openModal = (editing = false, data?: any) => {
    if (editing && data) {
      setEditingId(data._id);
      setFormData({
        registration_number: data.registration_number || "",
        chassis_number: data.chassis_number || "",
        engine_number: data.engine_number || "",
        registered_owner_name: data.registered_owner_name || "",
        container_dimension: data.container_dimension || "",
        loading_capacity: data.loading_capacity
          ? String(data.loading_capacity)
          : "",
      });
    } else {
      setEditingId(null);
      setFormData({
        registration_number: "",
        chassis_number: "",
        engine_number: "",
        registered_owner_name: "",
        container_dimension: "",
        loading_capacity: "",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  /* ---------------- ACTIONS ---------------- */
  const handleSubmit = async () => {
    if (!formData.registration_number || !formData.registered_owner_name) {
      Alert.alert("⚠️ Missing Fields", "Please fill required fields.");
      return;
    }

    try {
      if (editingId) {
        await updateTruck(editingId, {
          ...formData,
          loading_capacity: Number(formData.loading_capacity),
        });
        Alert.alert("Success", "Truck updated successfully.");
      } else {
        await addTruck({
          ...formData,
          loading_capacity: Number(formData.loading_capacity),
        });
        Alert.alert("Success", "Truck added successfully.");
      }
      closeModal();
      fetchTrucks();
    } catch {
      Alert.alert("Error", "Failed to save truck.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTruck(id);
          fetchTrucks();
        },
      },
    ]);
  };

  /* ---------------- GUARD ---------------- */
  if (loading && !user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-2 text-muted-foreground">
          Loading...
        </Text>
      </View>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      {/* LIST */}
      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {trucks.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No trucks found.
          </Text>
        ) : (
          trucks.map((truck) => (
            <TouchableOpacity
              key={truck._id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/trucks-profile",
                  params: { truck_id: truck._id },
                })
              }
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center"
            >
              {/* INFO */}
              <View className="flex-row items-start flex-1">
                <View style={{ backgroundColor: colors.secondary, padding: 8, borderRadius: 12, marginRight: 12 }}>
                  <MapPin size={18} color={colors.primary} />
                </View>

                <View className="flex-1">
                  <Text className="text-card-foreground font-semibold text-base">
                    {truck.registration_number}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    {truck.registered_owner_name}
                  </Text>
                </View>
              </View>

              {/* ACTIONS */}
              <View className="flex-row items-center ml-3">
                <TouchableOpacity
                  onPressIn={(e) => e.stopPropagation()}
                  onPress={() => openModal(true, truck)}
                  className="p-2"
                >
                  <Edit3 size={20} color={colors.mutedForeground} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPressIn={(e) => e.stopPropagation()}
                  onPress={() => handleDelete(truck._id)}
                  className="p-2"
                >
                  <Trash2 size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => openModal(false)}
        className="absolute bottom-8 right-6 w-16 h-16 rounded-full justify-center items-center"
        style={{
          backgroundColor: colors.primary,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Plus color={colors.primaryForeground} size={28} />
      </TouchableOpacity>

      <TruckFormModal
        visible={modalVisible}
        editing={!!editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}
