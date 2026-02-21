import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Image, Linking, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../../components/Skeleton";
import useDrivers from "../../hooks/useDriver";
import { useThemeStore } from "../../hooks/useThemeStore";
import { getFileUrl } from "../../lib/utils";

export default function DriverProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { driver_id } = useLocalSearchParams<{ driver_id?: string }>();
  const { drivers, loading, fetchDrivers, uploadLicense } = useDrivers();
  const [refreshing, setRefreshing] = useState(false);

  const driver = useMemo(() => (drivers || []).find((d: any) => String(d._id) === String(driver_id)), [drivers, driver_id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
  }, [fetchDrivers]);

  const handleUploadLicense = async () => {
    if (!driver_id) return;
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Allow gallery access to upload license.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });
    if (result.canceled) return;

    const file = {
      uri: result.assets[0].uri,
      name: result.assets[0].fileName || "license.jpg",
      type: result.assets[0].mimeType || "image/jpeg",
    };

    await uploadLicense(driver_id, file);
    Alert.alert("Updated", "License updated successfully.");
  };

  if (loading && !driver) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
        <Skeleton width={160} height={24} style={{ marginBottom: 14 }} />
        <Skeleton width="100%" height={220} borderRadius={16} />
      </SafeAreaView>
    );
  }

  if (!driver) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Driver not found</Text>
      </SafeAreaView>
    );
  }

  const assignedTruck =
    (driver as any)?.assigned_truck?.registration_number ||
    (driver as any)?.assigned_truck_number ||
    (driver as any)?.truck_number ||
    "Not assigned";
  const status = String((driver as any)?.status || ((driver as any)?.is_active ? "Active" : "Inactive"));
  const licenseUrl = driver.license_card_url ? getFileUrl(driver.license_card_url) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Driver Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>IDENTITY</Text>
          <InfoRow label="Name" value={driver.driver_name || driver.name || "-"} />
          <InfoRow label="Phone" value={driver.contact_number || driver.phone || "-"} />
          <InfoRow label="Assigned Truck" value={assignedTruck} />
          <InfoRow label="Status" value={status} />

          {!!(driver.contact_number || driver.phone) && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${driver.contact_number || driver.phone}`)}
              style={{ backgroundColor: colors.muted, borderRadius: 10, alignItems: "center", padding: 10, marginTop: 8 }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>Call Driver</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>LICENSE</Text>
          <TouchableOpacity onPress={handleUploadLicense} activeOpacity={0.85} style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
            {licenseUrl ? (
              <Image source={{ uri: licenseUrl }} style={{ width: "100%", height: 180 }} resizeMode="cover" />
            ) : (
              <View style={{ height: 120, alignItems: "center", justifyContent: "center", backgroundColor: colors.muted }}>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Tap to upload license</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}
