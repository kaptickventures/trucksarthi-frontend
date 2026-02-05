import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Edit3, Plus, Share2, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DriverFormModal from "../../components/DriverModal";
import { Skeleton } from "../../components/Skeleton";
import useDrivers from "../../hooks/useDriver";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";

export default function DriversManager() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { colors, theme } = useThemeStore();

  const {
    drivers,
    loading: driversLoading,
    fetchDrivers,
    addDriver,
    updateDriver,
    deleteDriver,
  } = useDrivers();

  const loading = userLoading || driversLoading;

  const [editingId, setEditingId] = useState<string | null>(null);
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
    }, [])
  );

  /* ---------------- IMAGE PICKER ---------------- */
  const pickImage = async (field: keyof typeof formData) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow gallery access to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setFormData({
        ...formData,
        [field]: result.assets[0].uri,
      });
    }
  };

  /* ---------------- MODAL GESTURE ---------------- */
  const openModal = (editing = false, data?: any) => {
    if (editing && data) {
      setEditingId(data._id);
      setFormData({
        driver_name: data.driver_name || "",
        contact_number: data.contact_number || "",
        identity_card_url: data.identity_card_url || "",
        license_card_url: data.license_card_url || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        driver_name: "",
        contact_number: "",
        identity_card_url: "",
        license_card_url: "",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert("⚠️ Missing Fields", "Please fill all required fields.");
        return;
      }
    }

    try {
      if (editingId) {
        await updateDriver(editingId, formData);
        Alert.alert("Success", "Driver updated successfully.");
      } else {
        await addDriver(formData);
        Alert.alert("Success", "Driver added successfully.");
      }
      closeModal();
      fetchDrivers();
    } catch {
      Alert.alert("Error", "Failed to save driver.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this driver?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDriver(id);
          fetchDrivers();
        },
      },
    ]);
  };

  const handleShare = async (driver: any) => {
    try {
      const message = `Driver Details:\nName: ${driver.driver_name}\nContact: ${driver.contact_number}`;
      await Share.share({
        message,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share driver details.");
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {(drivers || []).length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No drivers found.
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
                  })
                }
                className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text style={{ color: colors.foreground }} className="font-bold text-lg tracking-tight">
                      {driver.driver_name}
                    </Text>
                    <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
                      Commercial Operator
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); openModal(true, driver); }}
                      className="w-10 h-10 bg-muted rounded-full items-center justify-center border border-border/20"
                    >
                      <Edit3 size={16} color={colors.foreground} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); handleShare(driver); }}
                      className="w-10 h-10 bg-blue-500/10 rounded-full items-center justify-center"
                    >
                      <Share2 size={16} color="#3b82f6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); handleDelete(driver._id); }}
                      className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="gap-y-1.5 pt-1">
                  <Text style={{ color: colors.foreground }} className="text-sm font-medium">📞 {driver.contact_number}</Text>
                  <Text style={{ color: colors.foreground }} className="text-sm font-medium">📜 {driver.license_card_url ? "License Registered" : "License Missing"}</Text>
                </View>
              </TouchableOpacity>
            );
          })
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

      <DriverFormModal
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
