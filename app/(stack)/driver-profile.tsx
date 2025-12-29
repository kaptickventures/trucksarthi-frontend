import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Phone,
  User,
  Wallet,
  Pencil,
  PlusCircle,
  IndianRupee,
} from "lucide-react-native";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";

import useDrivers from "../../hooks/useDriver";
import { useDriverFinance } from "../../hooks/useDriverFinance";
import { useDriverPayroll } from "../../hooks/useDriverPayroll";

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

  /* ---------------- DRIVER FINANCE ---------------- */
  const {
    entries,
    fetchDriverLedger,
    fetchDriverSummary,
  } = useDriverFinance();

  const [netBalance, setNetBalance] = useState<number>(0);

  /* ---------------- DRIVER PAYROLL ---------------- */
  const {
    payrolls,
    fetchPayrollByDriver,
  } = useDriverPayroll();

  /* ---------------- INITIAL FETCH ---------------- */
  useEffect(() => {
    if (!DRIVER_ID) return;

    fetchDriverLedger(DRIVER_ID);
    fetchPayrollByDriver(DRIVER_ID);

    fetchDriverSummary(DRIVER_ID).then((res) => {
      setNetBalance(res.net_balance);
    });
  }, [DRIVER_ID]);

  /* ---------------- ACTIONS ---------------- */
  const handleCall = () => {
    if (!driver?.contact_number) return;
    Linking.openURL(`tel:${driver.contact_number}`);
  };

  const handleEditProfile = () => {
    router.push({
      pathname: "/(stack)/edit-driver",
      params: { driver_id: DRIVER_ID },
    });
  };

  const handleAddExpense = () => {
    router.push({
      pathname: "/(stack)/add-driver-expense",
      params: { driver_id: DRIVER_ID },
    });
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

          <View className="flex-row mt-5">
            <TouchableOpacity
              onPress={handleCall}
              className="bg-green-500 px-5 py-2.5 rounded-full flex-row items-center mr-3"
            >
              <Phone size={18} color="white" />
              <Text className="text-white font-semibold ml-2">
                Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEditProfile}
              className="bg-muted px-5 py-2.5 rounded-full flex-row items-center"
            >
              <Pencil size={18} />
              <Text className="font-semibold ml-2">
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
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
        <View className="mb-10">
          <Text className="text-lg font-semibold mb-4">
            Driver Ledger
          </Text>

          {entries.map((item) => (
            <View
              key={item.financial_id}
              className="bg-card border border-border rounded-xl p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <IndianRupee size={18} />
                <View className="ml-3">
                  <Text className="font-semibold capitalize">
                    {item.entry_type.replace("_", " ")}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.entry_date}
                  </Text>
                </View>
              </View>

              <Text
                className={`font-bold ${
                  item.entry_type === "advance" ||
                  item.entry_type === "expense"
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                ₹ {item.amount}
              </Text>
            </View>
          ))}
        </View>

        {/* Payroll */}
        <View className="mb-20">
          <Text className="text-lg font-semibold mb-4">
            Payroll History
          </Text>

          {payrolls.map((p) => (
            <View
              key={p.payroll_id}
              className="bg-card border border-border rounded-xl p-4 mb-3"
            >
              <View className="flex-row justify-between mb-2">
                <Text className="font-bold">
                  ₹ {p.total_amount}
                </Text>

                <Text
                  className={`text-xs font-semibold ${
                    p.status === "paid"
                      ? "text-green-600"
                      : "text-orange-500"
                  }`}
                >
                  {p.status.toUpperCase()}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Calendar size={14} />
                <Text className="text-xs text-muted-foreground ml-2">
                  {p.period_start} → {p.period_end}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Add Expense Button */}
      <TouchableOpacity
        onPress={handleAddExpense}
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <PlusCircle size={26} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
