import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";

import FinanceFAB from "../../components/finance/FinanceFAB";
import TruckFormModal from "../../components/TruckModal";
import type { TruckFormData } from "../../components/TruckModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";

export default function TruckKhataModules() {
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const { truckId: rawTruckId, truck_id: rawTruckIdAlt } = useLocalSearchParams<{ truckId?: string | string[]; truck_id?: string | string[] }>();
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

  const truckId = useMemo(() => {
    const value = rawTruckId ?? rawTruckIdAlt ?? "";
    return Array.isArray(value) ? value[0] : value;
  }, [rawTruckId, rawTruckIdAlt]);

  const selectedTruck = useMemo(
    () => (trucks || []).find((t: any) => String(t._id) === String(truckId)),
    [trucks, truckId]
  );

  const truckNumber = selectedTruck?.registration_number;
  const subtitle = truckId ? (truckNumber || "Selected Truck") : "Select a truck";

  const sections = [
    {
      title: "Daily Khata",
      description: "Fuel, Fastag recharge, challan",
      icon: "speedometer-outline",
      color: colors.destructive,
      bg: colors.destructiveSoft,
      route: truckId
        ? ({ pathname: "/(stack)/daily-khata-dashboard", params: { truckId } } as any)
        : ("/(stack)/daily-khata" as any),
    },
    {
      title: "Maintenance Khata",
      description: "Service, repair & documents",
      icon: "construct-outline",
      color: colors.warning,
      bg: colors.warningSoft,
      route: truckId
        ? ({ pathname: "/(stack)/maintenance-dashboard", params: { truckId } } as any)
        : ("/(stack)/maintenance-khata" as any),
    },
  ];

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

      <View style={{ padding: 20 }}>
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Truck Khata</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{subtitle}</Text>
        </View>

        <View style={{ gap: 10 }}>
          {sections.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={2}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
