import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Phone,
  User,
  Wallet,
} from "lucide-react-native";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DriverProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDark = useColorScheme() === "dark";

  /* ---------------- Dummy Driver Info ---------------- */
  const driverName = params.driver_name || "Ramesh Kumar";
  const contactNumber = params.contact_number || "+91 98765 43210";

  /* ---------------- Dummy Summary ---------------- */
  const netBalance = 18500;

  /* ---------------- Dummy Ledger ---------------- */
  const ledger = [
    {
      id: 1,
      type: "advance",
      date: "2025-03-02",
      amount: -5000,
    },
    {
      id: 2,
      type: "expense",
      date: "2025-03-06",
      amount: -1200,
    },
    {
      id: 3,
      type: "per trip",
      date: "2025-03-10",
      amount: 8500,
    },
    {
      id: 4,
      type: "salary",
      date: "2025-03-15",
      amount: 16200,
    },
  ];

  /* ---------------- Dummy Payroll ---------------- */
  const payrolls = [
    {
      id: 1,
      period_start: "2025-03-01",
      period_end: "2025-03-15",
      total_amount: 12500,
      status: "paid",
    },
    {
      id: 2,
      period_start: "2025-03-16",
      period_end: "2025-03-31",
      total_amount: 6000,
      status: "pending",
    },
  ];

  const handleCall = () => {
    Linking.openURL(`tel:${contactNumber}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Driver Profile</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Profile */}
        <View className="items-center mt-6 mb-8">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
            <User size={42} color="#2563EB" />
          </View>

          <Text className="text-2xl font-bold">{driverName}</Text>
          <Text className="text-muted-foreground mt-1">
            {contactNumber}
          </Text>
        </View>

        {/* Call Button */}
        <View className="flex-row justify-center mb-8">
          <TouchableOpacity
            onPress={handleCall}
            className="bg-green-500 px-6 py-3 rounded-full flex-row items-center"
          >
            <Phone size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Call Driver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-8 items-center">
          <Wallet size={24} />
          <Text className="text-2xl font-bold text-green-600 mt-2">
            ₹ {netBalance}
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            Net Balance
          </Text>
        </View>

        {/* Ledger */}
        <View className="mb-8">
          <Text className="text-lg font-semibold mb-4">
            Driver Ledger
          </Text>

          {ledger.map((item) => (
            <View
              key={item.id}
              className="bg-card border border-border rounded-xl p-4 mb-3 flex-row justify-between"
            >
              <View>
                <Text className="font-semibold capitalize">
                  {item.type}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.date}
                </Text>
              </View>

              <Text
                className={`font-semibold ${
                  item.amount >= 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                ₹ {item.amount}
              </Text>
            </View>
          ))}
        </View>

        {/* Payroll */}
        <View className="mb-10">
          <Text className="text-lg font-semibold mb-4">
            Payroll History
          </Text>

          {payrolls.map((p) => (
            <View
              key={p.id}
              className="bg-card border border-border rounded-xl p-4 mb-3"
            >
              <View className="flex-row justify-between mb-2">
                <Text className="font-semibold">
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
    </SafeAreaView>
  );
}
