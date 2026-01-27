import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Skeleton } from "../../components/Skeleton";
import TruckFormModal from "../../components/TruckModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { useUser } from "../../hooks/useUser";

export default function TrucksManager() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

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

  const [formData, setFormData] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

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

  if (loading && !user) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ gap: 8 }}>
                <Skeleton width={120} height={20} borderRadius={4} />
                <Skeleton width={180} height={12} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={40} height={40} borderRadius={20} />
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Skeleton width={200} height={14} borderRadius={4} />
              <Skeleton width={160} height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
              className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                  <Text style={{ color: colors.foreground }} className="font-bold text-lg uppercase tracking-tight">
                    {truck.registration_number}
                  </Text>
                  <Text className="text-muted-foreground text-xs font-medium uppercase tracking-widest mt-0.5">
                    {truck.vehicle_class || "HCV"} • FLEET UNIT
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); openModal(true, truck); }}
                    className="w-10 h-10 bg-muted rounded-full items-center justify-center border border-border/20"
                  >
                    <Edit3 size={16} color={colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleDelete(truck._id); }}
                    className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="gap-y-1.5 pt-1">
                <Text style={{ color: colors.foreground }} className="text-sm font-medium">🏢 {truck.registered_owner_name}</Text>
                <Text style={{ color: colors.foreground }} className="text-sm font-medium">📦 {truck.loading_capacity ? `${truck.loading_capacity} Tons` : "Capacity N/A"} • {truck.container_dimension || "Dim. N/A"}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
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
