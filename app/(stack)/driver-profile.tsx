import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ChevronDown,
  FileText,
  Pencil,
  Plus,
  Trash2,
  User,
  X
} from "lucide-react-native";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useDrivers from "../../hooks/useDriver";
import useDriverFinance, { CounterpartyType, TransactionNature } from "../../hooks/useDriverFinance";

export default function DriverProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { driver_id } = useLocalSearchParams<{ driver_id: string }>();
  const DRIVER_ID = useMemo(
    () => (driver_id ? Number(driver_id) : null),
    [driver_id]
  );

  const firebase_uid = getAuth().currentUser?.uid!;

  /* ---------------- DRIVER BASIC INFO ---------------- */
  const { drivers, loading, uploadLicense, uploadAadhaar, updateDriver, deleteDriver } = useDrivers(firebase_uid);

  const driver = useMemo(() => {
    if (!DRIVER_ID || drivers.length === 0) return null;
    return drivers.find(
      (d) => Number(d.driver_id) === Number(DRIVER_ID)
    );
  }, [drivers, DRIVER_ID]);


  /* ---------------- DRIVER LEDGER ---------------- */
  const {
    entries,
    fetchDriverLedger,
    fetchDriverSummary,
    addLedgerEntry,
  } = useDriverFinance();

  const [netBalance, setNetBalance] = useState<number>(0);


  /* ---------------- MODAL STATE ---------------- */
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // New Ledger Form State
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transactionNature, setTransactionNature] = useState<TransactionNature>("paid_by_driver");
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>("owner");

  // Edit Driver Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [visibleEntries, setVisibleEntries] = useState(5);

  /* ---------------- INITIAL FETCH ---------------- */
  useEffect(() => {
    if (!DRIVER_ID) return;

    fetchDriverLedger(DRIVER_ID);
    fetchDriverSummary(DRIVER_ID).then((res) =>
      setNetBalance(res.net_balance)
    );
  }, [DRIVER_ID]);


  /* ---------------- ACTIONS ---------------- */
  const handleUpload = async (type: "LICENSE" | "AADHAAR") => {
    if (!DRIVER_ID) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      if (type === "LICENSE") {
        await uploadLicense(DRIVER_ID, {
          uri: asset.uri,
          name: "license.jpg",
          mimeType: "image/jpeg",
        });
      } else {
        await uploadAadhaar(DRIVER_ID, {
          uri: asset.uri,
          name: "aadhaar.jpg",
          mimeType: "image/jpeg",
        });
      }

      Alert.alert("Success", "Document uploaded successfully");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCall = () => {
    if (!driver?.contact_number) return;
    Linking.openURL(`tel:${driver.contact_number}`);
  };

  const handleSaveEntry = async () => {
    if (!amount || !DRIVER_ID) return;
    if (!remarks.trim()) {
      Alert.alert("Required", "Please enter remarks.");
      return;
    }

    await addLedgerEntry({
      driver_id: DRIVER_ID,
      transaction_nature: transactionNature,
      counterparty_type: counterpartyType,
      amount: Number(amount),
      remarks,
      firebase_uid,
    });

    setAmount("");
    setRemarks("");
    setShowModal(false);

    fetchDriverLedger(DRIVER_ID);
    fetchDriverSummary(DRIVER_ID).then((res) =>
      setNetBalance(res.net_balance)
    );
  };

  /* ---------------- HELPERS ---------------- */
  const getTransactionTitle = (nature: TransactionNature | string, counterparty: CounterpartyType | string) => {
    if (!counterparty) return "Transaction";
    const cpLabel = counterparty.charAt(0).toUpperCase() + counterparty.slice(1);
    if (nature === "paid_by_driver") {
      return `Paid by Driver TO ${cpLabel}`;
    } else if (nature === "received_by_driver") {
      return `Received by Driver FROM ${cpLabel}`;
    }
    return nature ? nature.replace(/_/g, " ") : "Transaction";
  };


  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Loading driver...</Text>
      </SafeAreaView>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Driver Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Profile Card */}
        <View className="bg-card rounded-2xl p-4 mb-6">
          <View className="flex-row items-center ">
            <View className="w-14 h-14 bg-secondary rounded-full items-center justify-center mr-4">
              <User size={24} color="#16a34a" />
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-base font-semibold">
                {driver?.driver_name ?? "—"}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {driver?.contact_number ?? "—"}
              </Text>
            </View>

            {/* EDIT BUTTON */}
            <TouchableOpacity
              onPress={() => {
                setEditName(driver?.driver_name || "");
                setEditPhone(driver?.contact_number || "");
                setShowEditModal(true);
              }}
              className="p-2 bg-muted rounded-full"
            >
              <Pencil size={18} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
          </View>

          {/* ACTION ROW */}
          <View className="flex-row gap-4 mt-4">
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-muted py-2 rounded-xl items-center"
            >
              <Text className="font-semibold text-sm">📞 Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                driver?.contact_number &&
                Linking.openURL(
                  `https://wa.me/91${driver.contact_number}?text=Hello ${driver.driver_name}`
                )
              }
              className="flex-1 bg-green-600 py-2 rounded-xl items-center"
            >
              <Text className="font-semibold text-sm text-white">
                💬 WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DOCUMENTS */}
        <Text className="text-lg font-bold mb-3">Documents</Text>
        <View className="flex-row gap-4 mb-6">
          <DocumentCard
            label="License"
            url={driver?.license_card_url}
            onPress={() => driver?.license_card_url ? setPreviewImage(driver.license_card_url) : handleUpload("LICENSE")}
            onEdit={() => handleUpload("LICENSE")}
          />
          <DocumentCard
            label="Aadhaar"
            url={driver?.identity_card_url}
            onPress={() => driver?.identity_card_url ? setPreviewImage(driver.identity_card_url) : handleUpload("AADHAAR")}
            onEdit={() => handleUpload("AADHAAR")}
          />
        </View>

        {/* Balance Card */}
        <View className="flex-row gap-2 mb-6">
          <SummaryCard
            label="Total Balance"
            value={Math.abs(netBalance)}
            green={netBalance >= 0}
            red={netBalance < 0}
          />
        </View>

        {/* Add Entry Button - Full Width Bar */}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="bg-green-600 rounded-2xl py-4 flex-row items-center justify-center mb-6"
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-bold ml-2">Add Ledger Entry</Text>
        </TouchableOpacity>

        {/* Ledger */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold">Recent Transactions</Text>
          <Text className="text-xs text-muted-foreground">{entries.length} entries</Text>
        </View>

        {entries.length === 0 ? (
          <View className="bg-card rounded-2xl p-8 items-center justify-center mb-6">
            <Text className="text-muted-foreground">No ledger entries found</Text>
          </View>
        ) : (
          <View className="bg-card rounded-2xl overflow-hidden mb-6">
            {entries.slice(0, visibleEntries).map((item, index) => {
              const isPaidByDriver = item.transaction_nature === "paid_by_driver";

              // Determine display color: 
              // Paid BY Driver = Driver GAVE money/value -> Usually CREDIT in his favor.
              // Received BY Driver = Driver TOOK money -> DEBIT.
              const isCredit = isPaidByDriver;

              return (
                <View
                  key={item.entry_id}
                  className={`flex-row items-center p-4 ${index !== Math.min(entries.length, visibleEntries) - 1
                    ? "border-b border-border/50"
                    : ""
                    }`}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isCredit ? "bg-green-100" : "bg-red-100"
                      }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft size={20} color="#16a34a" />
                    ) : (
                      <ArrowUpRight size={20} color="#dc2626" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="font-bold text-sm">
                      {getTransactionTitle(item.transaction_nature, item.counterparty_type)}
                    </Text>
                    <Text className="text-[12px] text-muted-foreground mt-0.5">
                      {item.entry_date?.split("T")[0] || item.entry_date} {item.remarks ? `• ${item.remarks}` : ""}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className={`font-bold ${isCredit ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {isCredit ? "+" : "-"}₹{Number(item.amount).toLocaleString()}
                  </Text>
                </View>
              );
            })}

            {entries.length > visibleEntries && (
              <TouchableOpacity
                onPress={() => setVisibleEntries(prev => prev + 10)}
                className="py-3 items-center flex-row justify-center bg-muted/30"
              >
                <Text className="text-green-600 text-xs font-semibold mr-1">Load More Entries</Text>
                <ChevronDown size={14} color="#16a34a" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Button (Visible when modal is closed) */}
      {!showModal && (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="absolute bottom-6 right-6 bg-green-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{ elevation: 5 }}
        >
          <Plus size={26} color="white" />
        </TouchableOpacity>
      )}

      {/* ADD LEDGER MODAL */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 mb-8"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowModal(false)}
            className="flex-1 bg-black/40 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              className="bg-background rounded-t-3xl px-6 pt-4 pb-10"
            >
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
              </View>

              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-xl font-bold">
                    {getTransactionTitle(transactionNature, counterpartyType)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  className="w-9 h-9 rounded-full bg-muted items-center justify-center"
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isDark ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              {/* Transaction Nature Selection */}
              <View className="flex-row bg-muted rounded-2xl p-1 mb-4">
                <TouchableOpacity
                  onPress={() => setTransactionNature("paid_by_driver")}
                  activeOpacity={0.9}
                  className={`flex-1 py-3 rounded-xl items-center ${transactionNature === "paid_by_driver" ? "bg-green-600" : ""
                    }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${transactionNature === "paid_by_driver"
                      ? "text-white"
                      : "text-muted-foreground"
                      }`}
                  >
                    PAID BY DRIVER
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTransactionNature("received_by_driver")}
                  activeOpacity={0.9}
                  className={`flex-1 py-3 rounded-xl items-center ${transactionNature === "received_by_driver" ? "bg-green-600" : ""
                    }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${transactionNature === "received_by_driver"
                      ? "text-white"
                      : "text-muted-foreground"
                      }`}
                  >
                    RECEIVED BY DRIVER
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Counterparty Selection */}
              <View className="flex-row justify-between gap-2 mb-6">
                {(["owner", "vendor", "client"] as CounterpartyType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setCounterpartyType(type)}
                    className={`flex-1 py-2 rounded-lg items-center border ${counterpartyType === type
                      ? "bg-primary border-primary"
                      : "bg-background border-border"
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold capitalize ${counterpartyType === type ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* AMOUNT */}
              <View className="mb-6">
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Amount
                </Text>

                <View className="flex-row items-center bg-muted rounded-2xl px-4 h-14">
                  <Banknote size={20} color="#16a34a" />
                  <TextInput
                    placeholder="0"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-xl font-bold"
                    style={{
                      paddingVertical: 0,
                      textAlignVertical: "center",
                      lineHeight: 28,
                    }}
                  />
                  <Text className="text-xs font-semibold text-muted-foreground">
                    INR
                  </Text>
                </View>
              </View>

              {/* REMARKS */}
              <View className="mb-8">
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Remarks <Text className="text-red-500">*</Text>
                </Text>

                <TextInput
                  placeholder="Enter remarks (Required)"
                  value={remarks}
                  onChangeText={setRemarks}
                  className="bg-muted rounded-2xl px-4 py-4 text-sm"
                  placeholderTextColor="#94a3b8"
                  multiline
                />
              </View>

              {/* CTA */}
              <TouchableOpacity
                onPress={handleSaveEntry}
                activeOpacity={0.9}
                className="bg-green-600 py-4 rounded-2xl items-center"
              >
                <Text className="text-white font-bold text-base">
                  Save Entry
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* EDIT DRIVER MODAL */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
            className="flex-1 bg-black/40 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              className="bg-background rounded-t-3xl px-6 pt-4 pb-10"
            >
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
              </View>

              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold">Edit Driver</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={24} color={isDark ? "#FFF" : "#000"} />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium mb-1 text-muted-foreground">Driver Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  className="bg-muted rounded-xl px-4 py-3 text-base"
                  placeholder="Enter Name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium mb-1 text-muted-foreground">Contact Number</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                  className="bg-muted rounded-xl px-4 py-3 text-base"
                  placeholder="Enter Phone"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity
                onPress={async () => {
                  if (!editName || !editPhone) return Alert.alert("Error", "Please fill all fields");
                  if (DRIVER_ID) {
                    await updateDriver(DRIVER_ID, { driver_name: editName, contact_number: editPhone });
                    setShowEditModal(false);
                    Alert.alert("Success", "Driver updated");
                  }
                }}
                className="bg-primary py-4 rounded-xl items-center mb-3"
              >
                <Text className="text-primary-foreground font-bold">Update Driver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Confirm Delete", "Are you sure you want to delete this driver? This action cannot be undone.", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        if (DRIVER_ID) {
                          await deleteDriver(DRIVER_ID);
                          setShowEditModal(false);
                          router.back();
                          Alert.alert("Success", "Driver deleted");
                        }
                      }
                    }
                  ]);
                }}
                className="bg-red-50 py-4 rounded-xl items-center border border-red-200"
              >
                <View className="flex-row items-center gap-2">
                  <Trash2 size={18} color="#dc2626" />
                  <Text className="text-red-600 font-bold">Delete Driver</Text>
                </View>
              </TouchableOpacity>

            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>


      {/* IMAGE PREVIEW MODAL */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
          className="flex-1 bg-black/95"
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={() => setPreviewImage(null)}
            className="absolute top-12 right-6 z-10 bg-white/20 p-3 rounded-full"
            style={{ elevation: 5 }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {/* Image - prevent closing when tapping image */}
          {previewImage && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="flex-1 items-center justify-center"
            >
              <Image
                source={{ uri: previewImage }}
                style={{ width: "90%", height: "80%" }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>


    </SafeAreaView>
  );
}

/* ---------------- HELPERS ---------------- */

function DocumentCard({ label, url, onPress, onEdit }: any) {
  return (
    <View className="flex-1">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          aspectRatio: 1,
          width: "100%",
          backgroundColor: "#f3f4f6",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {url ? (
          <>
            {/* Image */}
            <Image
              source={{ uri: url }}
              style={{
                width: "100%",
                height: "100%",
              }}
              resizeMode="cover"
            />

            {/* Edit button */}
            <TouchableOpacity
              onPress={onEdit}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: 8,
                borderRadius: 20,
                zIndex: 10,
              }}
            >
              <Pencil size={14} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
            <FileText size={36} color="#94a3b8" />
            <Text style={{ fontSize: 11, fontWeight: "bold", marginTop: 8, textTransform: "uppercase", color: "#94a3b8" }}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Text className="text-center text-xs font-semibold mt-2 text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}


function SummaryCard({ label, value, green, red }: any) {
  return (
    <View className="flex-1 bg-card rounded-2xl p-3 justify-between min-h-[90px]">
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={`text-lg font-bold mt-2 ${green
          ? "text-green-600"
          : red
            ? "text-red-600"
            : "text-card-foreground"
          }`}
      >
        ₹ {Number(value).toLocaleString()}
      </Text>
    </View>
  );
}
