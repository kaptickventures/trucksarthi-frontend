import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Pencil,
  User as UserIcon
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useDrivers from "../../hooks/useDriver";
import useDriverFinance, { TransactionNature } from "../../hooks/useDriverFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { getFileUrl } from "../../lib/utils";

export default function DriverProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { driver_id } = useLocalSearchParams<{ driver_id: string }>();

  const { drivers, loading: driverLoading, uploadLicense, uploadAadhaar } = useDrivers();
  const driver = useMemo(() => drivers.find(d => d._id === driver_id), [drivers, driver_id]);

  const { entries, fetchDriverLedger, fetchDriverSummary, addLedgerEntry } = useDriverFinance();
  const [netBalance, setNetBalance] = useState<number>(0);

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transactionNature, setTransactionNature] = useState<TransactionNature>("paid_by_driver");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (driver_id) {
      fetchDriverLedger(driver_id);
      fetchDriverSummary(driver_id).then(res => setNetBalance(res.net_balance));
    }
  }, [driver_id]);

  const handleUpload = async (type: "LICENSE" | "AADHAAR") => {
    if (!driver_id) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3,
      });
      if (result.canceled) return;
      const file = { uri: result.assets[0].uri, name: `${type.toLowerCase()}.jpg`, type: "image/jpeg" };
      if (type === "LICENSE") await uploadLicense(driver_id, file);
      else await uploadAadhaar(driver_id, file);
      Alert.alert("Success", "Document uploaded successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to upload document");
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginLeft: 16 }}>Driver Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 24, backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={32} color={colors.mutedForeground} />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.foreground }}>{driver.driver_name}</Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{driver.contact_number}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />

          <View>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 }}>Balance Overview</Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: netBalance >= 0 ? colors.success : colors.destructive, marginTop: 4 }}>
              ₹{Math.abs(netBalance).toLocaleString()}
              <Text style={{ fontSize: 12 }}> {netBalance >= 0 ? "Credit" : "Debit"}</Text>
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>Documents</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <DocumentCard label="License" url={getFileUrl(driver.license_card_url)} onPress={() => driver.license_card_url && setPreviewImage(getFileUrl(driver.license_card_url))} onEdit={() => handleUpload("LICENSE")} />
            <DocumentCard label="Aadhaar" url={getFileUrl(driver.identity_card_url)} onPress={() => driver.identity_card_url && setPreviewImage(getFileUrl(driver.identity_card_url))} onEdit={() => handleUpload("AADHAAR")} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground }}>Financial Ledger</Text>
            <TouchableOpacity onPress={() => setShowModal(true)} style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 12 }}>+ New Entry</Text>
            </TouchableOpacity>
          </View>

          {entries.map((entry) => (
            <View key={entry._id} style={{ backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: entry.direction === 'from' ? (theme === 'dark' ? '#450a0a' : '#fef2f2') : (theme === 'dark' ? '#064e3b' : '#f0fdf4'), alignItems: 'center', justifyContent: 'center' }}>
                {entry.direction === 'from' ? <ArrowDownLeft size={20} color={colors.destructive} /> : <ArrowUpRight size={20} color={colors.success} />}
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.foreground }}>{entry.remarks}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>{new Date(entry.entry_date).toLocaleDateString()}</Text>
              </View>
              <Text style={{ fontWeight: '800', fontSize: 16, color: entry.direction === 'from' ? colors.destructive : colors.success }}>
                {entry.direction === 'from' ? '-' : '+'}₹{entry.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
            <View style={{ width: 40, height: 5, backgroundColor: colors.border, alignSelf: 'center', borderRadius: 3, marginBottom: 24 }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginBottom: 24 }}>Add Transaction</Text>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8 }}>Amount (₹)</Text>
                <TextInput placeholder="0.00" placeholderTextColor={colors.mutedForeground} value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ backgroundColor: colors.card, color: colors.foreground, padding: 16, borderRadius: 16, fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: colors.border }} />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8 }}>Remarks</Text>
                <TextInput placeholder="e.g. Food, Diesel, Advance" placeholderTextColor={colors.mutedForeground} value={remarks} onChangeText={setRemarks} style={{ backgroundColor: colors.card, color: colors.foreground, padding: 16, borderRadius: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border }} />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setTransactionNature("paid_by_driver")} style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: transactionNature === "paid_by_driver" ? colors.primary : colors.card, alignItems: 'center', borderWidth: 1, borderColor: transactionNature === "paid_by_driver" ? colors.primary : colors.border }}>
                  <Text style={{ fontWeight: 'bold', color: transactionNature === "paid_by_driver" ? colors.primaryForeground : colors.foreground }}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTransactionNature("received_by_driver")} style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: transactionNature === "received_by_driver" ? colors.primary : colors.card, alignItems: 'center', borderWidth: 1, borderColor: transactionNature === "received_by_driver" ? colors.primary : colors.border }}>
                  <Text style={{ fontWeight: 'bold', color: transactionNature === "received_by_driver" ? colors.primaryForeground : colors.foreground }}>Payment</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleSaveEntry} style={{ backgroundColor: colors.primary, padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 32 }}>
              <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16 }}>Save Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!previewImage} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setPreviewImage(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <Image source={{ uri: previewImage || "" }} style={{ width: '90%', height: '80%' }} resizeMode="contain" />
          <TouchableOpacity onPress={() => setPreviewImage(null)} style={{ position: 'absolute', top: 50, right: 24, backgroundColor: 'white', padding: 8, borderRadius: 24 }}>
            <Ionicons name="close" size={24} color="black" />
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
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ aspectRatio: 1, width: "100%", backgroundColor: colors.card, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
        {url ? (
          <>
            <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <TouchableOpacity onPress={onEdit} style={{ position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", padding: 8, borderRadius: 20 }}>
              <Pencil size={12} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: "center", opacity: 0.5 }}>
            <FileText size={32} color={colors.mutedForeground} />
            <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 8, color: colors.mutedForeground }}>MISSING</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: "bold", marginTop: 8, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}
