import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

import FinanceFAB from "../../components/finance/FinanceFAB";
import TruckFormModal from "../../components/TruckModal";
import type { TruckFormData } from "../../components/TruckModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";

export default function TruckKhata() {
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const { trucks, addTruck } = useTrucks();
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<TruckFormData>({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    vehicle_class: "",
    fuel_norms: "",
    registration_date: "",
    container_dimension: "",
    loading_capacity: "",
    rc_details: undefined,
  });
  const subtitle = useMemo(
    () => (trucks.length ? "Select a truck to continue" : "Add a truck to get started"),
    [trucks.length]
  );

  const openModal = () => {
    setFormData({
      registration_number: "",
      chassis_number: "",
      engine_number: "",
      registered_owner_name: "",
      vehicle_class: "",
      fuel_norms: "",
      registration_date: "",
      container_dimension: "",
      loading_capacity: "",
      rc_details: undefined,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!formData.registration_number) return;
    try {
      const saved = await addTruck({
        ...formData,
        loading_capacity: formData.loading_capacity ? Number(formData.loading_capacity) : undefined,
      });
      closeModal();
      if (saved?._id) {
        router.push({ pathname: "/(stack)/truck-manager-options", params: { truckId: saved._id } } as any);
      }
    } catch {
      // Errors are handled in the hook
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Truck Khata</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{subtitle}</Text>
        </View>

        {trucks.length === 0 ? (
          <Text className="text-center mb-4" style={{ color: colors.mutedForeground }}>
            No trucks found. Add one to continue.
          </Text>
        ) : (
          <View style={{ gap: 10, marginBottom: 16 }}>
            {trucks.map((truck: any) => {
              return (
                <TouchableOpacity
                  key={truck._id}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/(stack)/truck-khata-modules",
                      params: { truckId: String(truck._id) },
                    } as any)
                  }
                  style={{
                    backgroundColor: colors.card,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground }} className="font-bold text-lg uppercase tracking-tight">
                    {truck.registration_number}
                  </Text>
                  <Text className="text-xs font-medium uppercase tracking-widest mt-0.5" style={{ color: colors.mutedForeground }}>
                    {truck.registered_owner_name} | {truck.vehicle_class || "HCV"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <FinanceFAB onPress={openModal} />

      <TruckFormModal
        visible={modalVisible}
        editing={false}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </View>
  );
}
