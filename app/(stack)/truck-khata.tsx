import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Folder } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import FinanceFAB from "../../components/finance/FinanceFAB";
import TruckFormModal from "../../components/TruckModal";
import type { TruckFormData } from "../../components/TruckModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";

export default function TruckKhata() {
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const { trucks, loading, fetchTrucks, addTruck } = useTrucks();
  const [searchQuery, setSearchQuery] = useState("");
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
  const filteredTrucks = trucks.filter((truck) =>
    truck.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({ pathname: "/(stack)/truck-khata-modules", params: { truckId: item._id } } as any)
      }
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: colors.primary + "18",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Folder size={24} color={colors.primary} />
      </View>

      <View style={{ flex: 1, justifyContent: "center", minHeight: 52 }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>
          {item.registration_number}
        </Text>
        <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 3 }}>
          {`${item.make || "Truck"} ${item.vehicle_model || ""}`.trim()} • Manage truck
        </Text>
      </View>

      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.primary + "14",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 10,
        }}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={filteredTrucks}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ paddingBottom: 16 }}>
              <View className="mb-3 px-0">
                <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Truck Khata</Text>
                <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Select truck to open khata modules</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 50,
                }}
              >
                <Ionicons name="search" size={20} color={colors.mutedForeground} />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 16,
                    color: colors.foreground,
                    paddingVertical: 0,
                    includeFontPadding: false,
                  }}
                  placeholder="Search by truck number..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchTrucks}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.muted + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Folder size={40} color={colors.mutedForeground} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.mutedForeground }}>No trucks found</Text>
              </View>
            )
          }
        />
      </KeyboardAvoidingView>

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
