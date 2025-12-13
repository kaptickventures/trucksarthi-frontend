import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Building2,
  Mail,
  Phone,
  Pencil,
  Plus,
  FileText,
  Truck,
} from "lucide-react-native";
import {
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

/* ---------------- DUMMY DATA ---------------- */

const DUMMY_CLIENT = {
  client_name: "Acme Logistics Pvt Ltd",
  contact_person_name: "Rahul Sharma",
  contact_number: "+91 98765 43210",
  email_address: "rahul@acmelogistics.com",
};

const DUMMY_SUMMARY = {
  total_debits: 125000,
  total_credits: 80000,
  outstanding: 45000,
};

const DUMMY_INVOICES = [
  {
    invoice_id: 1,
    invoice_number: "INV-00124",
    total_amount: 35000,
    due_date: "2025-01-20",
    status: "pending",
  },
  {
    invoice_id: 2,
    invoice_number: "INV-00118",
    total_amount: 45000,
    due_date: "2024-12-15",
    status: "partial",
  },
  {
    invoice_id: 3,
    invoice_number: "INV-00102",
    total_amount: 45000,
    due_date: "2024-11-05",
    status: "paid",
  },
];

const DUMMY_TRIPS = [
  {
    trip_id: "TRP-1012",
    date: "2025-01-05",
    route: "Delhi → Jaipur",
    amount: 12000,
    invoiced: false,
  },
  {
    trip_id: "TRP-1015",
    date: "2025-01-10",
    route: "Delhi → Agra",
    amount: 8000,
    invoiced: true,
  },
  {
    trip_id: "TRP-1020",
    date: "2025-01-18",
    route: "Delhi → Chandigarh",
    amount: 15000,
    invoiced: false,
  },
];

/* ---------------- SCREEN ---------------- */

export default function ClientProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const [tripFilter, setTripFilter] = useState<
    "all" | "invoiced" | "uninvoiced"
  >("all");

  const filteredTrips = DUMMY_TRIPS.filter((t) => {
    if (tripFilter === "invoiced") return t.invoiced;
    if (tripFilter === "uninvoiced") return !t.invoiced;
    return true;
  });

  const uninvoicedTrips = DUMMY_TRIPS.filter((t) => !t.invoiced);

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
        <Text className="text-lg font-semibold">Client Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Profile Card */}
        <View className="bg-card border border-border rounded-3xl p-6 items-center mb-8">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-3">
            <Building2 size={40} color="#2563EB" />
          </View>

          <Text className="text-xl font-bold text-center">
            {DUMMY_CLIENT.client_name}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {DUMMY_CLIENT.contact_person_name}
          </Text>
        </View>

        {/* Ledger Summary */}
        <View className="flex-row gap-3 mb-8">
          <SummaryCard label="Billed" value={DUMMY_SUMMARY.total_debits} />
          <SummaryCard
            label="Received"
            value={DUMMY_SUMMARY.total_credits}
            green
          />
          <SummaryCard
            label="Outstanding"
            value={DUMMY_SUMMARY.outstanding}
            red
          />
        </View>

        {/* Invoices Header */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold">Invoices</Text>

          <TouchableOpacity
            onPress={() => Alert.alert("Add Payment", "Dummy")}
            className="bg-green-600 px-3 py-1.5 rounded-full"
          >
            <Text className="text-white text-xs font-semibold">
              + Add Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invoices */}
        {DUMMY_INVOICES.map((invoice) => (
          <View
            key={invoice.invoice_id}
            className="bg-card border border-border rounded-xl p-4 mb-3 flex-row justify-between items-center"
          >
            <View>
              <Text className="font-semibold text-sm">
                {invoice.invoice_number}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Due {invoice.due_date}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-base font-semibold">
                ₹ {invoice.total_amount}
              </Text>
              <StatusPill status={invoice.status} />
            </View>
          </View>
        ))}

        {/* Trip History */}
        <View className="mt-8 mb-24">
          <Text className="text-lg font-semibold mb-3">
            Trip History
          </Text>

          {/* Filters */}
          <View className="flex-row gap-2 mb-4">
            {["all", "uninvoiced", "invoiced"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setTripFilter(f as any)}
                className={`px-3 py-1.5 rounded-full ${
                  tripFilter === f
                    ? "bg-blue-600"
                    : "bg-muted"
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold tracking-wide ${
                    tripFilter === f
                      ? "text-white"
                      : "text-foreground"
                  }`}
                >
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Generate Invoice */}
          {tripFilter === "uninvoiced" &&
            uninvoicedTrips.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Generate Invoice", "Dummy")
                }
                className="bg-blue-600 py-2.5 rounded-lg mb-4 items-center"
              >
                <Text className="text-white text-sm font-semibold">
                  Generate Invoice ({uninvoicedTrips.length})
                </Text>
              </TouchableOpacity>
            )}

          {/* Trips */}
          {filteredTrips.map((trip) => (
            <View
              key={trip.trip_id}
              className="bg-card border border-border rounded-xl p-4 mb-3"
            >
              <View className="flex-row justify-between mb-1">
                <Text className="font-semibold text-sm">
                  {trip.trip_id}
                </Text>
                <Text className="text-base font-semibold">
                  ₹ {trip.amount}
                </Text>
              </View>

              <Text className="text-xs text-muted-foreground">
                {trip.route}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {trip.date}
              </Text>

              <View
                className={`self-start mt-2 px-3 py-1 rounded-full ${
                  trip.invoiced
                    ? "bg-green-100"
                    : "bg-orange-100"
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold tracking-wide ${
                    trip.invoiced
                      ? "text-green-800"
                      : "text-orange-800"
                  }`}
                >
                  {trip.invoiced ? "INVOICED" : "NOT INVOICED"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Create Invoice */}
      <TouchableOpacity
        onPress={() => Alert.alert("Create Invoice", "Dummy")}
        className="absolute bottom-6 right-6 bg-blue-600 w-12 h-12 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={22} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

function SummaryCard({ label, value, green, red }: any) {
  return (
    <View className="flex-1 bg-card border border-border rounded-2xl p-4 items-center">
      <Text
        className={`text-lg font-bold ${
          green ? "text-green-600" : red ? "text-red-500" : ""
        }`}
      >
        ₹ {value}
      </Text>
      <Text className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">
        {label}
      </Text>
    </View>
  );
}

function StatusPill({ status }: any) {
  const styles =
    status === "paid"
      ? "bg-green-100 text-green-800"
      : status === "partial"
      ? "bg-orange-100 text-orange-800"
      : "bg-red-100 text-red-800";

  return (
    <View className={`px-3 py-1 rounded-full mt-1 ${styles}`}>
      <Text className="text-[11px] font-semibold tracking-wide">
        {status.toUpperCase()}
      </Text>
    </View>
  );
}
