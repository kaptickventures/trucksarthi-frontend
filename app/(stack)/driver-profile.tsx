import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pencil,
  Share2,
  Trash2,
  User as UserIcon,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import BottomSheet from "../../components/BottomSheet";

import DriverFormModal from "../../components/DriverModal";
import { Skeleton } from "../../components/Skeleton";
import useDrivers from "../../hooks/useDriver";
import { useThemeStore } from "../../hooks/useThemeStore";
import { getFileUrl } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

export default function DriverProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const { driver_id } = useLocalSearchParams<{ driver_id: string }>();

  const { drivers, loading: driverLoading, uploadLicense, uploadAadhaar, uploadProfilePicture, fetchDrivers, deleteDriver, updateDriver } = useDrivers();
  const driver = useMemo(() => drivers.find(d => d._id === driver_id), [drivers, driver_id]);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [editFormData, setEditFormData] = useState({
    driver_name: "",
    contact_number: "",
    identity_card_url: "",
    license_card_url: "",
  });

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

  const handleShare = async () => {
    if (!driver) return;
    try {
      const message = `${t('driverProfile')}:\nName: ${driver.driver_name}\nContact: ${driver.contact_number}`;
      await Share.share({ message });
    } catch {
      Alert.alert(t('error'), "Could not share driver details.");
    }
  };

  const handleUpload = async (type: "LICENSE" | "AADHAAR" | "PROFILE") => {
    if (!driver_id) return;
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Allow access to your photos to upload documents.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName || `${type.toLowerCase()}.jpg`,
        type: asset.mimeType || "image/jpeg"
      };
      if (type === "LICENSE") {
        await uploadLicense(driver_id, file);
      } else if (type === "AADHAAR") {
        await uploadAadhaar(driver_id, file);
      } else {
        await uploadProfilePicture(driver_id, file);
      }

      Alert.alert(t('success'), type === "PROFILE" ? t('uploadSuccess') : t('uploadSuccess'));
    } catch {
      Alert.alert(t('error'), type === "PROFILE" ? t('uploadFailed') : t('uploadFailed'));
    }
  };

  const openEditModal = () => {
    if (driver) {
      setEditFormData({
        driver_name: driver.driver_name || "",
        contact_number: driver.contact_number || "",
        identity_card_url: driver.identity_card_url || "",
        license_card_url: driver.license_card_url || "",
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateDriver = async () => {
    if (!driver_id) return;
    try {
      await updateDriver(driver_id, editFormData as any);
      Alert.alert(t('success'), t('updatedSuccessfully'));
      setShowEditModal(false);
      fetchDrivers();
    } catch (err) {
      Alert.alert(t('error'), "Failed to update driver.");
    }
  };

  const handleDeleteDriver = () => {
    if (!driver_id) return;
    Alert.alert(t("confirmDelete"), "Delete this driver?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await deleteDriver(driver_id);
          router.back();
        },
      },
    ]);
  };

  if (driverLoading || !driver) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3 px-0 flex-row justify-between items-center">
          <View>
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('driverProfile')}</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('viewManageDriverDetails')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={handleShare}>
              <Share2 size={22} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openEditModal}>
              <Pencil size={22} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteDriver}>
              <Trash2 size={22} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ padding: 24, backgroundColor: colors.card, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 70, height: 70, marginRight: 10, position: "relative" }}>
              <TouchableOpacity
                onPress={() => (driver.profile_picture_url ? setPreviewImage(getFileUrl(driver.profile_picture_url)) : handleUpload("PROFILE"))}
                style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', overflow: "hidden" }}
              >
                {driver.profile_picture_url ? (
                  <Image source={{ uri: getFileUrl(driver.profile_picture_url) || "" }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <UserIcon size={32} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUpload("PROFILE")}
                style={{ position: "absolute", right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card }}
              >
                <Pencil size={12} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.foreground }}>{driver.driver_name}</Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>{driver.contact_number}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20, opacity: 0.5 }} />

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity
              onPress={() =>
                driver.contact_number &&
                Linking.openURL(`tel:${driver.contact_number}`)
              }
              style={{ flex: 1, backgroundColor: colors.muted, paddingVertical: 12, borderRadius: 16, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '700', fontSize: 14, color: colors.foreground }}>📞 {t('call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                driver.contact_number &&
                Linking.openURL(
                  `https://wa.me/91${driver.contact_number}?text=Hello ${driver.driver_name}`
                )
              }
              style={{ flex: 1, backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 16, alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="logo-whatsapp" size={20} color="white" />
                <Text style={{ fontWeight: '700', fontSize: 14, color: 'white' }}>
                  {t('whatsapp')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>{t('documents')}</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <DocumentCard label={t('license')} url={getFileUrl(driver.license_card_url)} onPress={() => driver.license_card_url && setPreviewImage(getFileUrl(driver.license_card_url))} onEdit={() => handleUpload("LICENSE")} />
            <DocumentCard label={t('aadhaar')} url={getFileUrl(driver.identity_card_url)} onPress={() => driver.identity_card_url && setPreviewImage(getFileUrl(driver.identity_card_url))} onEdit={() => handleUpload("AADHAAR")} />
          </View>
        </View>
      </ScrollView>

      <BottomSheet
        visible={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Document Preview"
      >
        <View style={{ paddingBottom: 20 }}>
          <Image
            source={{ uri: previewImage || "" }}
            style={{ width: '100%', height: 400, borderRadius: 20 }}
            resizeMode="contain"
          />
        </View>
      </BottomSheet>

      <DriverFormModal
        visible={showEditModal}
        editing={true}
        formData={editFormData}
        setFormData={setEditFormData as any}
        onSubmit={handleUpdateDriver}
        onClose={() => setShowEditModal(false)}
      />
    </View>
  );
}

function DocumentCard({ label, url, onPress, onEdit }: any) {
  const { colors } = useThemeStore();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={url ? onPress : onEdit}
        activeOpacity={0.85}
        style={{
          aspectRatio: 1,
          width: "100%",
          backgroundColor: colors.card,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {url ? (
          <>
            <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <TouchableOpacity onPress={onEdit} style={{ position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", padding: 8, borderRadius: 20 }}>
              <Pencil size={12} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: "center", opacity: 0.7 }}>
            <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
            <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 8, color: colors.primary }}>{t('tapToUpload')}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: "bold", marginTop: 8, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}
