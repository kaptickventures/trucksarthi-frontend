import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Building2, Mail, MapPin, Phone } from "lucide-react-native";
import {
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

/* ---------------- DUMMY DATA ---------------- */

const DUMMY_CLIENT = {
  client_name: "Acme Logistics Pvt Ltd",
  contact_person_name: "Rahul Sharma",
  contact_number: "+91 98765 43210",
  email_address: "rahul@acmelogistics.com",
  office_address: "Transport Nagar, New Delhi – 110001",
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
    client_id: 1,
    total_amount: 35000,
    due_date: "2025-01-20",
    status: "pending",
  },
  {
    invoice_id: 2,
    invoice_number: "INV-00118",
    client_id: 1,
    total_amount: 45000,
    due_date: "2024-12-15",
    status: "partial",
  },
  {
    invoice_id: 3,
    invoice_number: "INV-00102",
    client_id: 1,
    total_amount: 45000,
    due_date: "2024-11-05",
    status: "paid",
  },
];

/* ---------------- SCREEN ---------------- */

export default function ClientProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDark = useColorScheme() === "dark";

  const clientId = params.clientId ? Number(params.clientId) : 1;

  // Use dummy data
  const [summary] = useState(DUMMY_SUMMARY);
  const invoices = DUMMY_INVOICES;

  const {
    client_name,
    contact_person_name,
    contact_number,
    email_address,
    office_address,
  } = DUMMY_CLIENT;

  const handleCall = () => {
    Linking.openURL(`tel:${contact_number}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${email_address}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>

        <Text className="text-lg font-semibold">Client Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Profile */}
        <View className="items-center mt-4 mb-8">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Building2 size={40} color="#2563EB" />
          </View>

          <Text className="text-2xl font-bold mb-1 text-center">
            {client_name}
          </Text>

          <Text className="text-muted-foreground">
            {contact_person_name}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row justify-center gap-4 mb-8">
          <TouchableOpacity
            onPress={handleCall}
            className="bg-green-500 flex-row items-center px-6 py-3 rounded-full"
          >
            <Phone size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmail}
            className="bg-blue-500 flex-row items-center px-6 py-3 rounded-full"
          >
            <Mail size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Email</Text>
          </TouchableOpacity>
        </View>

        {/* Ledger Summary */}
        <View className="bg-card border border-border p-4 rounded-2xl mb-8">
          <View className="flex-row justify-between">
            <SummaryItem label="Billed" value={summary.total_debits} />
            <SummaryItem label="Received" value={summary.total_credits} green />
            <SummaryItem label="Outstanding" value={summary.outstanding} red />
          </View>
        </View>

        {/* Contact Info */}
        <View className="mb-8">
          <Text className="text-lg font-semibold mb-4">
            Contact Information
          </Text>

          <View className="bg-card border border-border rounded-2xl p-4 gap-4">
            <InfoRow
              icon={<Phone size={20} />}
              label="Phone"
              value={contact_number}
            />

            <Divider />

            <InfoRow
              icon={<Mail size={20} />}
              label="Email"
              value={email_address}
            />

            <Divider />

            <InfoRow
              icon={<MapPin size={20} />}
              label="Address"
              value={office_address}
            />
          </View>
        </View>

        {/* Invoices */}
        <View className="mb-10">
          <Text className="text-lg font-semibold mb-4">Invoices</Text>

          {invoices.map((invoice) => (
            <View
              key={invoice.invoice_id}
              className="bg-card border border-border rounded-xl p-4 mb-3 flex-row justify-between"
            >
              <View>
                <Text className="font-semibold">
                  {invoice.invoice_number}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Due: {invoice.due_date}
                </Text>
              </View>

              <View className="items-end">
                <Text className="font-semibold">
                  ₹ {invoice.total_amount}
                </Text>
                <Text
                  className={`text-xs ${
                    invoice.status === "paid"
                      ? "text-green-600"
                      : invoice.status === "partial"
                      ? "text-orange-500"
                      : "text-red-500"
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Small Components ---------- */

function InfoRow({ icon, label, value }: any) {
  return (
    <View className="flex-row items-center">
      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
        {icon}
      </View>
      <View>
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text className="font-medium">{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View className="h-[1px] bg-border" />;
}

function SummaryItem({ label, value, green, red }: any) {
  return (
    <View className="items-center flex-1">
      <Text
        className={`text-xl font-bold ${
          green ? "text-green-600" : red ? "text-red-500" : ""
        }`}
      >
        ₹ {value}
      </Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
