import { useFocusEffect } from "@react-navigation/native";
import { Edit3, Plus, Trash2, Share2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Share
} from "react-native";
import LocationFormModal from "../../components/LocationModal";
import { Skeleton } from "../../components/Skeleton";
import useLocations from "../../hooks/useLocation";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { useTranslation } from "../../context/LanguageContext";
import { useLocationPicker } from "../../context/LocationPickerContext";
import { reverseGeocode } from "../../lib/reverseGeocode";

const parseCoordString = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const candidates = [
    raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/),
    raw.match(/^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/),
    raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/),
  ].filter(Boolean) as RegExpMatchArray[];

  const match = candidates[0];
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

const isCoordAddress = (value?: string) => Boolean(parseCoordString(value));

export default function LocationsManager() {
  const { user, loading: userLoading } = useUser();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const { draft, clearDraft } = useLocationPicker();
  const isDark = theme === "dark";

  const {
    locations,
    loading: locationsLoading,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLocations();

  const loading = userLoading || locationsLoading;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    location_name: "",
    complete_address: "",
    place_id: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const pending = (locations || []).filter((loc: any) => {
        const id = String(loc?._id || "");
        if (!id) return false;
        if (resolvedAddresses[id]) return false;

        const addressRaw = String(loc?.complete_address || "").trim();
        const addressLooksLikeCoords = isCoordAddress(addressRaw);

        const lat = Number(loc?.latitude);
        const lng = Number(loc?.longitude);
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

        return addressLooksLikeCoords || (!addressRaw && hasCoords);
      });

      for (const loc of pending) {
        const id = String(loc?._id || "");
        const addressRaw = String(loc?.complete_address || "").trim();
        const coordsFromString = parseCoordString(addressRaw);
        const lat = Number.isFinite(Number(loc?.latitude)) ? Number(loc?.latitude) : coordsFromString?.lat;
        const lng = Number.isFinite(Number(loc?.longitude)) ? Number(loc?.longitude) : coordsFromString?.lng;

        const res = await reverseGeocode(Number(lat), Number(lng));
        if (cancelled) return;
        setResolvedAddresses((prev) => ({
          ...prev,
          [id]: res?.formattedAddress || "Address unavailable",
        }));
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [locations, resolvedAddresses]);

  useEffect(() => {
    if (!draft) return;
    setFormData((prev) => ({
      ...prev,
      ...draft,
      // Keep title user-controlled in the modal; picker should only update location details.
      location_name: prev.location_name,
    }));
    setModalVisible(true);
    clearDraft();
  }, [draft, clearDraft]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setResolvedAddresses({});
      await fetchLocations();
    } catch (error) {
      console.error(error);
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
        place_id: data.place_id || "",
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } else {
      setEditingId(null);
      setFormData({
        location_name: "",
        complete_address: "",
        place_id: "",
        latitude: undefined,
        longitude: undefined,
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    const locationTitle = String(formData.location_name || "").trim();
    if (!locationTitle) {
      Alert.alert(t("missingFields"), "Location title is required.");
      return;
    }

    const normalizedAddress = String(formData.complete_address || "").trim() ||
      (Number.isFinite(formData.latitude) && Number.isFinite(formData.longitude)
        ? `${Number(formData.latitude).toFixed(6)}, ${Number(formData.longitude).toFixed(6)}`
        : "");

    if (!normalizedAddress) {
      Alert.alert(t("missingFields"), "Please add a Google location before saving.");
      return;
    }

    const payload = {
      ...formData,
      location_name: locationTitle,
      complete_address: normalizedAddress,
    };

    try {
      if (editingId) {
        await updateLocation(editingId, payload);
        Alert.alert(t("success"), `Location ${t("updatedSuccessfully")}`);
      } else {
        await addLocation(payload);
        Alert.alert(t("success"), `Location ${t("addedSuccessfully")}`);
      }
      fetchLocations();
      closeModal();
    } catch {
      Alert.alert(t("error"), "Failed to save location.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("confirmDelete"), "Delete this location?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await deleteLocation(id);
          fetchLocations();
        },
      },
    ]);
  };

  const getGoogleMapsLink = (loc: any) => {
    const lat = Number(loc?.latitude);
    const lng = Number(loc?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    const query = encodeURIComponent(String(loc?.complete_address || loc?.location_name || "").trim());
    return query
      ? `https://www.google.com/maps/search/?api=1&query=${query}`
      : "https://www.google.com/maps";
  };

  const handleShareLocation = async (loc: any) => {
    try {
      const title = String(loc?.location_name || "").trim() || "Location";
      const id = String(loc?._id || "");
      const raw = String(loc?.complete_address || "").trim();
      const address =
        String(resolvedAddresses[id] || "").trim() ||
        (isCoordAddress(raw) ? "" : raw) ||
        "Address not available";
      const mapsLink = getGoogleMapsLink(loc);
      const message = `Location Title: ${title}\nLocation Address: ${address}\nGoogle Maps Link: ${mapsLink}`;
      await Share.share({ message });
    } catch {
      Alert.alert(t("error"), "Failed to share location.");
    }
  };

  if (loading && !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('locations')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Manage your business locations</Text>
        </View>
        {locations.length === 0 ? (
          <Text className="text-center mt-10" style={{ color: colors.mutedForeground }}>
            {t("noLocationsFound")}
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
                    onPress={() => handleShareLocation(loc)}
                    className="w-10 h-10 rounded-full items-center justify-center border"
                    style={{ backgroundColor: colors.muted, borderColor: colors.border + '33' }}
                  >
                    <Share2 size={16} color={colors.foreground} />
                  </TouchableOpacity>

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
                    <Trash2 size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="gap-y-1">
                <Text style={{ color: colors.mutedForeground }} className="text-sm font-medium">
                  Address: {resolvedAddresses[String(loc._id)] || (isCoordAddress(loc.complete_address) ? "Resolving address..." : loc.complete_address) || "Full address not added"}
                </Text>
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
          shadowColor: colors.shadow,
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Plus color={colors.primaryForeground} size={28} />
      </TouchableOpacity>

      <LocationFormModal
        visible={modalVisible}
        editing={!!editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </View>
  );
}
