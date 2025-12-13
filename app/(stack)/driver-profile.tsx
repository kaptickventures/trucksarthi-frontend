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

export default function DriverProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDark = useColorScheme() === "dark";

  const driverName = params.driver_name || "Ramesh Kumar";
  const contactNumber = params.contact_number || "+91 98765 43210";

  const netBalance = 18500;

  const ledger = [
    { id: 1, type: "advance", date: "2025-03-02", amount: -5000 },
    { id: 2, type: "expense", date: "2025-03-06", amount: -1200 },
    { id: 3, type: "per trip", date: "2025-03-10", amount: 8500 },
    { id: 4, type: "salary", date: "2025-03-15", amount: 16200 },
  ];

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

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Edit driver details (dummy action)");
  };

  const handleAddExpense = () => {
    Alert.alert("Add Expense", "Open add expense flow (dummy)");
  };

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

          <Text className="text-2xl font-bold">{driverName}</Text>
          <Text className="text-muted-foreground mt-1">
            {contactNumber}
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
          <Text className="text-3xl font-bold text-green-600 mt-3">
            ₹ {netBalance}
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            Net Balance
          </Text>
        </View>

        {/* Ledger */}
        <View className="mb-10">
          <Text className="text-lg font-semibold mb-4">
            Driver Ledger
          </Text>

          {ledger.map((item) => (
            <View
              key={item.id}
              className="bg-card border border-border rounded-xl p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <IndianRupee size={18} />
                <View className="ml-3">
                  <Text className="font-semibold capitalize">
                    {item.type}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.date}
                  </Text>
                </View>
              </View>

              <Text
                className={`font-bold ${
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
        <View className="mb-20">
          <Text className="text-lg font-semibold mb-4">
            Payroll History
          </Text>

          {payrolls.map((p) => (
            <View
              key={p.id}
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
