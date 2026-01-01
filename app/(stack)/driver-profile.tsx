import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Phone,
  User,
  Wallet,
  Pencil,
  PlusCircle,
  IndianRupee,
  X,
} from "lucide-react-native";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Linking,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";

import useDrivers from "../../hooks/useDriver";
import useDriverFinance from "../../hooks/useDriverFinance";

export default function DriverProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { driver_id } = useLocalSearchParams<{ driver_id: string }>();
  const DRIVER_ID = Number(driver_id);

  const firebase_uid = getAuth().currentUser?.uid!;

  /* ---------------- DRIVER BASIC INFO ---------------- */
  const { drivers } = useDrivers(firebase_uid);

  const driver = useMemo(
    () => drivers.find((d) => d.driver_id === DRIVER_ID),
    [drivers, DRIVER_ID]
  );

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
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"credit" | "debit">("credit");
  const [category, setCategory] = useState("daily_allowance");
  const [remarks, setRemarks] = useState("");

  /* ---------------- INITIAL FETCH ---------------- */
  useEffect(() => {
    if (!DRIVER_ID) return;

    fetchDriverLedger(DRIVER_ID);
    fetchDriverSummary(DRIVER_ID).then((res) =>
      setNetBalance(res.net_balance)
    );
  }, [DRIVER_ID]);

  /* ---------------- ACTIONS ---------------- */
  const handleCall = () => {
    if (!driver?.contact_number) return;
    Linking.openURL(`tel:${driver.contact_number}`);
  };

  const handleSaveEntry = async () => {
    if (!amount) return;

    await addLedgerEntry({
      driver_id: DRIVER_ID,
      entry_type: entryType,
      amount: Number(amount),
      category,
      remarks,
      firebase_uid,
    });

    setAmount("");
    setRemarks("");
    setShowModal(false);

    fetchDriverSummary(DRIVER_ID).then((res) =>
      setNetBalance(res.net_balance)
    );
  };

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

      <ScrollView className="flex-1 px-6">
        {/* Profile Card */}
        <View className="bg-card border border-border rounded-3xl p-6 items-center mb-8">
          <View className="w-28 h-28 bg-blue-100 rounded-full items-center justify-center mb-4">
            <User size={48} color="#2563EB" />
          </View>

          <Text className="text-2xl font-bold">
            {driver?.driver_name ?? "—"}
          </Text>

          <Text className="text-muted-foreground mt-1">
            {driver?.contact_number ?? "—"}
          </Text>

          <TouchableOpacity
            onPress={handleCall}
            className="bg-green-500 px-5 py-2.5 rounded-full flex-row items-center mt-4"
          >
            <Phone size={18} color="white" />
            <Text className="text-white font-semibold ml-2">Call</Text>
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-8 items-center">
          <Wallet size={26} />
          <Text
            className={`text-3xl font-bold mt-3 ${
              netBalance >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            ₹ {Math.abs(netBalance)}
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            {netBalance >= 0
              ? "Company owes driver"
              : "Driver owes company"}
          </Text>
        </View>

        {/* Ledger */}
        <View className="mb-24">
          <Text className="text-lg font-semibold mb-4">
            Driver Ledger
          </Text>

          {entries.map((item) => (
            <View
              key={item.entry_id}
              className="bg-card border border-border rounded-xl p-4 mb-3 flex-row justify-between"
            >
              <View>
                <Text className="font-semibold capitalize">
                  {item.category.replace("_", " ")}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.entry_date}
                </Text>
              </View>

              <Text
                className={`font-bold ${
                  item.entry_type === "debit"
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                ₹ {item.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <PlusCircle size={26} color="white" />
      </TouchableOpacity>

      {/* ADD LEDGER MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-card rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">
                Add Ledger Entry
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <TextInput
              placeholder="Amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              className="border border-border rounded-xl px-4 py-3 mb-3"
            />

            {/* Entry Type */}
            <View className="flex-row mb-3">
              {["credit", "debit"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setEntryType(t as any)}
                  className={`flex-1 py-3 rounded-xl items-center mx-1 ${
                    entryType === t
                      ? "bg-blue-600"
                      : "bg-muted"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      entryType === t
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <TextInput
              placeholder="Category (daily_allowance, advance, salary)"
              value={category}
              onChangeText={setCategory}
              className="border border-border rounded-xl px-4 py-3 mb-3"
            />

            {/* Remarks */}
            <TextInput
              placeholder="Remarks (optional)"
              value={remarks}
              onChangeText={setRemarks}
              className="border border-border rounded-xl px-4 py-3 mb-4"
            />

            <TouchableOpacity
              onPress={handleSaveEntry}
              className="bg-blue-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">
                Save Entry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
