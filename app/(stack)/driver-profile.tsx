import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Share2,
  Trash2,
  User as UserIcon,
  CheckCircle,
  XCircle
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Skeleton } from "../../components/Skeleton";
import useDrivers from "../../hooks/useDriver";
import useDriverFinance, { TransactionNature } from "../../hooks/useDriverFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate, getFileUrl } from "../../lib/utils";

export default function DriverProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { driver_id } = useLocalSearchParams<{ driver_id: string }>();

  const { drivers, loading: driverLoading, uploadLicense, uploadAadhaar, uploadProfilePicture, fetchDrivers } = useDrivers();
  const driver = useMemo(() => drivers.find(d => d._id === driver_id), [drivers, driver_id]);

  const { entries, fetchDriverLedger, fetchDriverSummary, addLedgerEntry, updateEntryStatus } = useDriverFinance();
  const [netBalance, setNetBalance] = useState<number>(0);

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transactionNature, setTransactionNature] = useState<TransactionNature>("paid_by_driver");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDrivers(),
        driver_id ? fetchDriverLedger(driver_id) : Promise.resolve(),
        driver_id ? fetchDriverSummary(driver_id).then(res => setNetBalance(res.net_balance)) : Promise.resolve(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [driver_id, fetchDrivers, fetchDriverLedger, fetchDriverSummary]);

  useEffect(() => {
    if (driver_id) {
      fetchDriverLedger(driver_id);
      fetchDriverSummary(driver_id).then(res => setNetBalance(res.net_balance));
    }
  }, [driver_id]);

  const handleShare = async () => {
    if (!driver) return;
    try {
      const message = `Driver Details:\nName: ${driver.driver_name}\nContact: ${driver.contact_number}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert("Error", "Could not share driver details.");
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
        mediaTypes: [ImagePicker.MediaType.images],
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

      Alert.alert("Success", type === "PROFILE" ? "Profile photo uploaded successfully" : "Document uploaded successfully");
    } catch (e) {
      Alert.alert("Error", type === "PROFILE" ? "Failed to upload profile photo" : "Failed to upload document");
    }
  };

  const handleSaveEntry = async () => {
    if (!amount || !driver_id || !remarks.trim()) {
      Alert.alert("Required", "Please fill all fields");
      return;
    }
    await addLedgerEntry({
      driver_id,
      transaction_nature: transactionNature,
      counterparty_type: "owner",
      amount: Number(amount),
      remarks,
      direction: transactionNature === "paid_by_driver" ? "to" : "from",
    });
    setAmount("");
    setRemarks("");
    setShowModal(false);
    fetchDriverLedger(driver_id);
    fetchDriverSummary(driver_id).then(res => setNetBalance(res.net_balance));
  };

  if (driverLoading || !driver) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={120} height={24} />
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </View>

        <View style={{ padding: 24, marginHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Skeleton width={64} height={64} borderRadius={32} />
            <View style={{ marginLeft: 16, gap: 8 }}>
              <Skeleton width={150} height={28} />
              <Skeleton width={100} height={16} />
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />
          <View style={{ gap: 8 }}>
            <Skeleton width={100} height={14} />
            <Skeleton width={200} height={40} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Skeleton width={100} height={24} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Skeleton style={{ flex: 1, aspectRatio: 1, borderRadius: 20 }} />
            <Skeleton style={{ flex: 1, aspectRatio: 1, borderRadius: 20 }} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Skeleton width={150} height={24} />
            <Skeleton width={80} height={30} borderRadius={8} />
          </View>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} width="100%" height={72} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginLeft: 16 }}>Driver Profile</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={handleShare}>
            <Share2 size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert("Coming Soon", "Edit functionality is in the main list.")}>
            <Pencil size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert("Coming Soon", "Delete functionality is in the main list.")}>
            <Trash2 size={22} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={{ padding: 24, backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
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
            <View style={{ marginLeft: 16, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.foreground }}>{driver.driver_name}</Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>{driver.contact_number}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => driver.contact_number && Linking.openURL(`tel:${driver.contact_number}`)}
                  style={{ backgroundColor: colors.muted, padding: 10, borderRadius: 20 }}
                >
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => driver.contact_number && Linking.openURL(`https://wa.me/91${driver.contact_number}`)}
                  style={{ backgroundColor: '#25D366', padding: 10, borderRadius: 20 }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>Documents</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <DocumentCard label="License" url={getFileUrl(driver.license_card_url)} onPress={() => driver.license_card_url && setPreviewImage(getFileUrl(driver.license_card_url))} onEdit={() => handleUpload("LICENSE")} />
            <DocumentCard label="Aadhaar" url={getFileUrl(driver.identity_card_url)} onPress={() => driver.identity_card_url && setPreviewImage(getFileUrl(driver.identity_card_url))} onEdit={() => handleUpload("AADHAAR")} />
          </View>
        </View>

      </ScrollView>

      <Modal visible={!!previewImage} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setPreviewImage(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <Image source={{ uri: previewImage || "" }} style={{ width: '90%', height: '80%' }} resizeMode="contain" />
          <TouchableOpacity onPress={() => setPreviewImage(null)} style={{ position: 'absolute', top: 50, right: 24, backgroundColor: colors.card, padding: 8, borderRadius: 24 }}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function DocumentCard({ label, url, onPress, onEdit }: any) {
  const { colors } = useThemeStore();
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
            <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 8, color: colors.primary }}>TAP TO UPLOAD</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: "bold", marginTop: 8, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}
