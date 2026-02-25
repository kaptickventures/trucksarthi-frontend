import { useFocusEffect } from "@react-navigation/native";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LocationFormModal from "../../components/LocationModal";
import { Skeleton } from "../../components/Skeleton";
import useLocations from "../../hooks/useLocation";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";

export default function LocationsManager() {
  const { user, loading: userLoading } = useUser();

  const {
    locations,
    loading: locationsLoading,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLocations();

  const loading = userLoading || locationsLoading;

  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    location_name: "",
    complete_address: "",
  });

  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchLocations();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchLocations]);

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [fetchLocations])
  );

  const openModal = (editing = false, data?: any) => {
    if (editing && data) {
      setEditingId(data._id);
      setFormData({
        location_name: data.location_name,
        complete_address: data.complete_address || "",
      });
    } else {
      setEditingId(null);
      setFormData({ location_name: "", complete_address: "" });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!formData.location_name) {
      Alert.alert("⚠️ Missing Fields", "Location title is required.");
      return;
    }

    try {
      if (editingId) {
        await updateLocation(editingId, formData);
        Alert.alert("Success", "Location updated successfully.");
      } else {
        await addLocation(formData);
        Alert.alert("Success", "Location added successfully.");
      }
      fetchLocations();
      closeModal();
    } catch (e) {
      Alert.alert("Error", "Failed to save location.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteLocation(id);
          fetchLocations();
        },
      },
    ]);
  };

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="px-5 pt-2">
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} className="border rounded-2xl p-5 mb-4 shadow-sm" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <View className="flex-row justify-between mb-3">
                <View style={{ gap: 8 }}>
                  <Skeleton width={150} height={24} borderRadius={4} />
                  <Skeleton width={80} height={12} borderRadius={4} />
                </View>
                <View className="flex-row gap-2">
                  <Skeleton width={40} height={40} borderRadius={20} />
                  <Skeleton width={40} height={40} borderRadius={20} />
                </View>
              </View>
              <Skeleton width="100%" height={20} borderRadius={4} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* List */}
      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {locations.length === 0 ? (
          <Text className="text-center mt-10" style={{ color: colors.mutedForeground }}>
            No locations found.
          </Text>
        ) : (
          locations.map((loc) => (
            <View
              key={loc._id}
              className="border rounded-2xl p-4 mb-3 shadow-sm"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-3">
                  <Text style={{ color: colors.foreground }} className="font-bold text-lg tracking-tight">
                    {loc.location_name}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => openModal(true, loc)}
                    className="w-10 h-10 rounded-full items-center justify-center border"
                    style={{ backgroundColor: colors.muted, borderColor: colors.border + '33' }}
                  >
                    <Edit3 size={16} color={colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(loc._id)}
                    className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="gap-y-1">
                <Text style={{ color: colors.mutedForeground }} className="text-sm font-medium">📍 {loc.complete_address}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add FAB */}
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
        <Plus color="white" size={28} />
      </TouchableOpacity>

      <LocationFormModal
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
