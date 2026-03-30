import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Plus, Share2, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import DriverFormModal from "../../components/DriverModal";
import { Skeleton } from "../../components/Skeleton";
import useDrivers from "../../hooks/useDriver";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { useTranslation } from "../../context/LanguageContext";
import { formatPhoneNumber } from "../../lib/utils";

export default function DriversManager() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();

  const {
    drivers,
    loading: driversLoading,
    fetchDrivers,
    addDriver,
    deleteDriver,
    uploadLicense,
    uploadAadhaar,
  } = useDrivers();

  const loading = userLoading || driversLoading;

  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDrivers();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDrivers]);

  const [formData, setFormData] = useState({
    driver_name: "",
    contact_number: "",
    identity_card_url: "",
    license_card_url: "",
  });

  const requiredFields: Array<keyof typeof formData> = [
    "driver_name",
    "contact_number",
  ];

  /* ---------------- FETCH ON FOCUS ---------------- */
  useFocusEffect(
    useCallback(() => {
      fetchDrivers();
    }, [fetchDrivers])
  );

  /* ---------------- MODAL GESTURE ---------------- */
  const openModal = () => {
    setFormData({
      driver_name: "",
      contact_number: "",
      identity_card_url: "",
      license_card_url: "",
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert(t("missingFields"), "Please fill all required fields.");
        return;
      }
    }

    try {
      const newDriver = await addDriver(formData);
      const driverId = newDriver._id;

      // Handle image uploads if they are new (objects with uri)
      const uploadPromises = [];
      if (formData.license_card_url && typeof formData.license_card_url === 'object' && (formData.license_card_url as any).uri) {
        uploadPromises.push(uploadLicense(driverId, formData.license_card_url));
      }
      if (formData.identity_card_url && typeof formData.identity_card_url === 'object' && (formData.identity_card_url as any).uri) {
        uploadPromises.push(uploadAadhaar(driverId, formData.identity_card_url));
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      Alert.alert(t("success"), `Driver ${t("addedSuccessfully")}`);
      closeModal();
      fetchDrivers();
    } catch (err) {
      console.error("Submit error:", err);
      const msg =
        (err as any)?.response?.data?.error ||
        (err as any)?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to save driver details or upload documents.";
      Alert.alert(t("error"), msg);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("confirmDelete"), "Delete this driver?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await deleteDriver(id);
          fetchDrivers();
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
                <Skeleton width={140} height={20} borderRadius={4} />
                <Skeleton width={100} height={12} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={40} height={40} borderRadius={20} />
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Skeleton width={160} height={14} borderRadius={4} />
              <Skeleton width={180} height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('drivers')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Manage your fleet drivers</Text>
        </View>

        {(drivers || []).length === 0 ? (
          <Text className="text-center mt-10" style={{ color: colors.mutedForeground }}>
            {t("noDriversFound")}
          </Text>
        ) : (
          (drivers || []).map((driver) => {
            if (!driver) return null;
            return (
              <TouchableOpacity
                key={driver._id}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/(stack)/driver-profile",
                    params: {
                      driver_id: driver._id,
                    },
                  } as any)
                }
                className="border rounded-2xl p-4 mb-3 shadow-sm"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-3">
                    <Text style={{ color: colors.foreground }} className="font-bold text-lg tracking-tight">
                      {driver.driver_name}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (driver.contact_number) {
                          const cleaned = driver.contact_number.replace(/\D/g, "");
                          const waNumber = cleaned.length === 12 && cleaned.startsWith("91") ? cleaned : `91${cleaned.slice(-10)}`;
                          Linking.openURL(`https://wa.me/${waNumber}`);
                        }
                      }}
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.successSoft }}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color={colors.success} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); handleDelete(driver._id); }}
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.destructiveSoft }}
                    >
                      <Trash2 size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="gap-y-1">
                  <Text style={{ color: colors.foreground }} className="text-sm font-medium">Phone: <Text style={{ color: colors.mutedForeground }}>{formatPhoneNumber(driver.contact_number || "")}</Text></Text>
                  <Text style={{ color: colors.foreground }} className="text-sm font-medium">License: <Text style={{ color: driver.license_card_url ? colors.success : colors.destructive }}>{driver.license_card_url ? "Uploaded" : "Not Uploaded"}</Text></Text>
                  <Text style={{ color: colors.foreground }} className="text-sm font-medium">Aadhar: <Text style={{ color: driver.identity_card_url ? colors.success : colors.destructive }}>{driver.identity_card_url ? "Uploaded" : "Not Uploaded"}</Text></Text>
                </View>
              </TouchableOpacity>
            );
          })
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

      <DriverFormModal
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
