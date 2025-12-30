import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Building2, Plus, FileText } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import useClients from "../../hooks/useClient";
import { LedgerEntry, useClientLedger } from "../../hooks/useClientLedger";
import { Invoice, useInvoices } from "../../hooks/useInvoice";
import useTrips, { Trip } from "../../hooks/useTrip";

export default function ClientProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  /* ---------------- ROUTE PARAM ---------------- */
  const { clientId } = useLocalSearchParams<{ clientId?: string | string[] }>();

  const numericClientId = useMemo(() => {
    if (!clientId) return null;
    if (Array.isArray(clientId)) return Number(clientId[0]);
    const n = Number(clientId);
    return Number.isNaN(n) ? null : n;
  }, [clientId]);

  /* ---------------- AUTH ---------------- */
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, [auth]);

  const firebase_uid = user?.uid ?? "";

  /* ---------------- STATE ---------------- */
  const [tripFilter, setTripFilter] = useState<
    "all" | "invoiced" | "uninvoiced"
  >("all");

  const [summary, setSummary] = useState({
    total_debits: 0,
    total_credits: 0,
    outstanding: 0,
  });

  const [selectedTrips, setSelectedTrips] = useState<number[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  const toggleTripSelection = (tripId: number) => {
    setSelectedTrips((prev) =>
      prev.includes(tripId)
        ? prev.filter((id) => id !== tripId)
        : [...prev, tripId]
    );
  };

  /* ---------------- DATA HOOKS ---------------- */
  const { clients, loading: clientsLoading, fetchClients } =
    useClients(firebase_uid);

  const { invoices, fetchInvoices, createInvoice } =
    useInvoices(firebase_uid);

  const { trips, fetchTrips } = useTrips(firebase_uid, { autoFetch: false });

  const {
    entries,
    fetchLedger,
    fetchSummary,
    addPayment,
  } = useClientLedger();

  /* ---------------- FETCH (AUTH SAFE) ---------------- */
  useEffect(() => {
    if (!user || !firebase_uid || !numericClientId) return;

    fetchClients();
    fetchInvoices();
    fetchTrips(firebase_uid);
    fetchLedger(numericClientId);

    fetchSummary(numericClientId)
      .then(setSummary)
      .catch(() =>
        setSummary({
          total_debits: 0,
          total_credits: 0,
          outstanding: 0,
        })
      );
  }, [user, firebase_uid, numericClientId]);

  /* ---------------- HELPERS ---------------- */
  const normalizeInvoiceStatus = (status: any) => {
    if (!status) return "not_invoiced";
    return status.toString().toLowerCase().replace(" ", "_");
  };

  /* ---------------- DERIVED ---------------- */
  const client = useMemo(() => {
    if (!numericClientId) return undefined;
    return clients.find(
      (c) => Number(c.client_id) === Number(numericClientId)
    );
  }, [clients, numericClientId]);

  const clientInvoices = invoices.filter(
    (i: Invoice) => Number(i.client_id) === Number(numericClientId)
  );

  const clientTrips = trips.filter(
    (t: Trip) => Number(t.client_id) === Number(numericClientId)
  );

  const filteredTrips = useMemo(() => {
    if (tripFilter === "invoiced") {
      return clientTrips.filter(
        (t) => normalizeInvoiceStatus(t.invoiced_status) === "invoiced"
      );
    }

    if (tripFilter === "uninvoiced") {
      return clientTrips.filter(
        (t) => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced"
      );
    }

    return clientTrips;
  }, [tripFilter, clientTrips]);

  const uninvoicedTrips = clientTrips.filter(
    (t) => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced"
  );

  /* ---------------- ACTIONS ---------------- */
  const handleGenerateInvoice = async () => {
    if (!selectedTrips.length || !numericClientId) {
      Alert.alert("Select uninvoiced trips");
      return;
    }

    await createInvoice({
      client_id: numericClientId,
      tripIds: selectedTrips,
      due_date: new Date().toISOString().split("T")[0],
    });

    setSelectedTrips([]);
    fetchInvoices();
    fetchTrips(firebase_uid);
    fetchLedger(numericClientId);
    fetchSummary(numericClientId).then(setSummary);
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || !numericClientId) {
      Alert.alert("Enter amount");
      return;
    }

    await addPayment({
      client_id: numericClientId,
      amount: Number(paymentAmount),
      remarks: paymentRemarks,
    });

    setPaymentAmount("");
    setPaymentRemarks("");
    setShowPaymentForm(false);

    fetchLedger(numericClientId);
    fetchSummary(numericClientId).then(setSummary);
  };

  /* ---------------- GUARDS ---------------- */
  if (authLoading || clientsLoading || !numericClientId) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-muted-foreground">Client not found</Text>
      </SafeAreaView>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
        {/* Client Card */}
        <View className="bg-card border border-border rounded-3xl p-6 items-center mb-8">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-3">
            <Building2 size={40} color="#2563EB" />
          </View>
          <Text className="text-xl font-bold">{client.client_name}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {client.contact_person_name}
          </Text>
        </View>

        {/* Summary */}
        <View className="flex-row gap-3 mb-3">
          <SummaryCard label="Billed" value={summary.total_debits} />
          <SummaryCard label="Received" value={summary.total_credits} green />
          <SummaryCard label="Outstanding" value={summary.outstanding} red />
        </View>

        {/* Add Payment */}
        <TouchableOpacity
          onPress={() => setShowPaymentForm((p) => !p)}
          className="mb-4 self-center"
        >
          <Text className="text-blue-600 font-semibold">+ Add Payment</Text>
        </TouchableOpacity>

        {showPaymentForm && (
          <View className="bg-card border border-border rounded-xl p-4 mb-6">
            <TextInput
              placeholder="Amount"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              className="border border-border rounded-lg px-3 py-2 mb-2"
            />
            <TextInput
              placeholder="Remarks (optional)"
              value={paymentRemarks}
              onChangeText={setPaymentRemarks}
              className="border border-border rounded-lg px-3 py-2 mb-3"
            />
            <TouchableOpacity
              onPress={handleAddPayment}
              className="bg-blue-600 py-2 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Save Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ledger */}
        <Text className="text-lg font-semibold mb-3">Ledger</Text>

        {entries.length === 0 ? (
          <Text className="text-muted-foreground mb-6">
            No ledger entries found.
          </Text>
        ) : (
          entries.map((e: LedgerEntry) => (
            <View
              key={e.entry_id}
              className="bg-card border border-border rounded-xl p-4 mb-2 flex-row justify-between"
            >
              <View>
                <Text className="font-semibold">
                  {e.entry_type === "credit" ? "Payment" : "Invoice"}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {e.entry_date}
                </Text>
                {e.remarks && (
                  <Text className="text-xs text-muted-foreground">
                    {e.remarks}
                  </Text>
                )}
              </View>
              <Text
                className={`font-semibold ${
                  e.entry_type === "credit"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ₹ {e.amount}
              </Text>
            </View>
          ))
        )}

        {/* Trip History */}
        <View className="mt-8 mb-8">
          <Text className="text-lg font-semibold mb-3">Trip History</Text>

          <View className="flex-row gap-2 mb-4">
            {["all", "uninvoiced", "invoiced"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setTripFilter(f as any)}
                className={`px-3 py-1.5 rounded-full ${
                  tripFilter === f ? "bg-blue-600" : "bg-muted"
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    tripFilter === f ? "text-white" : "text-foreground"
                  }`}
                >
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTrips.map((trip: Trip) => {
            const status = normalizeInvoiceStatus(trip.invoiced_status);
            const isUninvoiced = status === "not_invoiced";

            return (
              <TouchableOpacity
                key={trip.trip_id}
                disabled={!isUninvoiced}
                onPress={() => toggleTripSelection(trip.trip_id)}
                className={`bg-card border rounded-xl p-4 mb-3 ${
                  selectedTrips.includes(trip.trip_id)
                    ? "border-blue-600"
                    : "border-border"
                } ${!isUninvoiced && "opacity-50"}`}
              >
                <View className="flex-row justify-between mb-1">
                  <Text className="font-semibold">
                    Trip #{trip.trip_id}
                  </Text>
                  <Text className="font-semibold">
                    ₹ {trip.cost_of_trip}
                  </Text>
                </View>

                {/* STATUS TAG (ADDED) */}
                <View className="mt-2 self-start px-3 py-0.5 rounded-full bg-muted">
                  <Text
                    className={`text-[11px] font-semibold ${
                      isUninvoiced
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isUninvoiced ? "UNINVOICED" : "INVOICED"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* INVOICES LIST (ADDED, NO REMOVALS) */}
        <Text className="text-lg font-semibold mb-3">Invoices</Text>

        {clientInvoices.length === 0 ? (
          <Text className="text-muted-foreground mb-6">
            No invoices yet.
          </Text>
        ) : (
          clientInvoices.map((inv) => (
            <View
              key={inv.invoice_id}
              className="bg-card border border-border rounded-xl p-4 mb-2 flex-row justify-between"
            >
              <View>
                <Text className="font-semibold">
                  Invoice #{inv.invoice_number}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Due: {inv.due_date}
                </Text>
              </View>
              <FileText size={18} color="#2563EB" />
            </View>
          ))
        )}
      </ScrollView>

      {/* CREATE INVOICE FAB */}
      {uninvoicedTrips.length > 0 && (
        <TouchableOpacity
          onPress={handleGenerateInvoice}
          className="absolute bottom-6 right-6 bg-blue-600 w-12 h-12 rounded-full items-center justify-center"
        >
          <Plus size={22} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

/* ---------------- HELPERS ---------------- */

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
      <Text className="text-[11px] text-muted-foreground mt-1">
        {label}
      </Text>
    </View>
  );
}
