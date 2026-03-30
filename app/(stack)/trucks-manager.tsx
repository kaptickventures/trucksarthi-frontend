import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { Skeleton } from "../../components/Skeleton";
import TruckFormModal from "../../components/TruckModal";
import type { TruckFormData } from "../../components/TruckModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { useUser } from "../../hooks/useUser";
import { useTranslation } from "../../context/LanguageContext";

export default function TrucksManager() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { openAdd } = useLocalSearchParams<{ openAdd?: string }>();
  const didAutoOpenRef = useRef(false);

  const {
    trucks,
    loading: trucksLoading,
    fetchTrucks,
    addTruck,
    deleteTruck,
  } = useTrucks();

  const loading = userLoading || trucksLoading;

  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTrucks();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTrucks]);

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

  /* ---------------- FETCH ---------------- */
  useFocusEffect(
    useCallback(() => {
      fetchTrucks();
    }, [fetchTrucks])
  );

  /* ---------------- MODAL ---------------- */
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

  useEffect(() => {
    if (openAdd && !didAutoOpenRef.current) {
      didAutoOpenRef.current = true;
      openModal();
    }
  }, [openAdd]);

  /* ---------------- ACTIONS ---------------- */
  const handleSubmit = async () => {
    if (!formData.registration_number) {
      Alert.alert(t("missingFields"), "Please fill required field: Registration Number.");
      return;
    }

    try {
      await addTruck({
        ...formData,
        loading_capacity: formData.loading_capacity ? Number(formData.loading_capacity) : undefined,
      });
      Alert.alert(t("success"), `Truck ${t("addedSuccessfully")}`);
      closeModal();
      fetchTrucks();
    } catch {
      Alert.alert(t("error"), "Failed to save truck.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("confirmDelete"), "Delete this truck?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('trucks')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Manage your fleet vehicles</Text>
        </View>

        {trucks.length === 0 ? (
          <Text className="text-center mt-10" style={{ color: colors.mutedForeground }}>
            {t("noTrucksFound")}
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
                } as any)
              }
              className="border rounded-2xl p-4 mb-3 shadow-sm"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-3">
                  <Text style={{ color: colors.foreground }} className="font-bold text-lg uppercase tracking-tight">
                    {truck.registration_number}
                  </Text>
                  <Text className="text-xs font-medium uppercase tracking-widest mt-0.5" style={{ color: colors.mutedForeground }}>
                    {truck.registered_owner_name} | {truck.vehicle_class || "HCV"}
                  </Text>
                </View>
                <View className="flex-row gap-2">


                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleDelete(truck._id); }}
                    className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center"
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => openModal()}
        className="absolute bottom-8 right-6 w-16 h-16 rounded-full justify-center items-center"
        style={{
          backgroundColor: colors.primary,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Plus color={colors.primaryForeground} size={28} />
      </TouchableOpacity>

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
