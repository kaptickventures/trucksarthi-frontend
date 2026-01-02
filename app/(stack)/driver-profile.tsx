import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ChevronDown,
  Plus,
  User
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useDrivers from "../../hooks/useDriver";
import useDriverFinance from "../../hooks/useDriverFinance";

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
  const { drivers, loading } = useDrivers(firebase_uid);

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
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"credit" | "debit">("credit");
  const [category, setCategory] = useState("daily_allowance");
  const [remarks, setRemarks] = useState("");
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
  const handleCall = () => {
    if (!driver?.contact_number) return;
    Linking.openURL(`tel:${driver.contact_number}`);
  };

  const handleSaveEntry = async () => {
    if (!amount || !DRIVER_ID) return;

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

    fetchDriverLedger(DRIVER_ID);
    fetchDriverSummary(DRIVER_ID).then((res) =>
      setNetBalance(res.net_balance)
    );
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
              const isCredit = item.entry_type === "credit";
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
                    <Text className="font-bold text-sm capitalize">
                      {item.category.replace("_", " ")}
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

      {/* Floating Button */}
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
          {/* BACKDROP */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowModal(false)}
            className="flex-1 bg-black/40 justify-end"
          >
            {/* SHEET */}
            <TouchableOpacity
              activeOpacity={1}
              className="bg-background rounded-t-3xl px-6 pt-4 pb-10"
            >
              {/* DRAG HANDLE */}
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
              </View>

              {/* HEADER */}
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-xl font-bold">Add Ledger Entry</Text>
                  <Text className="text-sm text-muted-foreground mt-0.5">
                    {driver?.driver_name}
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

                {/* QUICK AMOUNT PILLS */}
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {[500, 1000, 2000, 5000, 10000].map((amt) => {
                    const active = amount === amt.toString();
                    return (
                      <TouchableOpacity
                        key={amt}
                        onPress={() => setAmount(amt.toString())}
                        className={`px-3 py-1.5 rounded-full ${active ? "bg-green-600" : "bg-muted"
                          }`}
                      >
                        <Text className={`text-[10px] font-bold ${active ? "text-white" : "text-foreground"}`}>
                          + ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ENTRY TYPE PILLS */}
                <View className="flex-row bg-muted rounded-2xl p-1 mt-4">
                  <TouchableOpacity
                    onPress={() => setEntryType("credit")}
                    activeOpacity={0.9}
                    className={`flex-1 py-3 rounded-xl items-center ${entryType === "credit" ? "bg-green-600" : ""
                      }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${entryType === "credit"
                        ? "text-white"
                        : "text-muted-foreground"
                        }`}
                    >
                      PAYMENT TO DRIVER
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setEntryType("debit")}
                    activeOpacity={0.9}
                    className={`flex-1 py-3 rounded-xl items-center ${entryType === "debit" ? "bg-green-600" : ""
                      }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${entryType === "debit"
                        ? "text-white"
                        : "text-muted-foreground"
                        }`}
                    >
                      ADVANCE / EXPENSE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* DETAILS */}
              <View className="mb-8">
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Category
                </Text>

                {/* CATEGORY PILLS */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                  contentContainerStyle={{ gap: 8, paddingRight: 20 }}
                >
                  {["salary", "advance", "daily_allowance", "fuel", "repair", "bonus"].map((cat) => {
                    const active = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full ${active ? "bg-green-600" : "bg-muted"
                          }`}
                      >
                        <Text className={`text-[11px] font-bold capitalize ${active ? "text-white" : "text-foreground"}`}>
                          {cat.replace("_", " ")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TextInput
                  placeholder="Enter custom category..."
                  value={category}
                  onChangeText={setCategory}
                  className="bg-muted rounded-2xl px-4 py-4 mb-3 text-sm"
                  placeholderTextColor="#94a3b8"
                />

                <TextInput
                  placeholder="Remarks (optional)"
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
    </SafeAreaView>
  );
}

/* ---------------- HELPERS ---------------- */

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
