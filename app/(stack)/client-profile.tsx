import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Building2, Plus } from "lucide-react-native";
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
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const numericClientId = Number(clientId);

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
  }, []);

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

  const { trips, fetchTrips } = useTrips(firebase_uid);

  const {
    entries,
    fetchLedger,
    fetchSummary,
    addPayment,
  } = useClientLedger();

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!firebase_uid || !numericClientId) return;

    fetchClients();
    fetchInvoices();
    fetchTrips();
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
  }, [firebase_uid, numericClientId]);

  /* ---------------- DERIVED ---------------- */
  const client = useMemo(
    () => {
      // Debug: Log all available client IDs and their types to diagnose mismatch
      if (clients.length > 0) {
        console.log("DEBUG: Available Clients:", clients.map(c => ({
          id: c.client_id,
          type: typeof c.client_id,
          matches: String(c.client_id) === String(clientId)
        })));
      }

      // Robust comparison: Convert both to string to handle '42' vs 42
      return clients.find((c) => String(c.client_id) === String(clientId));
    },
    [clients, clientId]
  );

  const clientInvoices = invoices.filter(
    (i: Invoice) => i.client_id === numericClientId
  );

  const clientTrips = trips.filter(
    (t: Trip) => t.client_id === numericClientId
  );

  const filteredTrips = useMemo(() => {
    if (tripFilter === "invoiced")
      return clientTrips.filter(
        (t) => t.invoiced_status === "invoiced"
      );

    if (tripFilter === "uninvoiced")
      return clientTrips.filter(
        (t) => t.invoiced_status === "not_invoiced"
      );

    return clientTrips;
  }, [tripFilter, clientTrips]);

  const uninvoicedTrips = clientTrips.filter(
    (t) => t.invoiced_status === "not_invoiced"
  );

  /* ---------------- ACTIONS ---------------- */
  const handleGenerateInvoice = async () => {
    if (selectedTrips.length === 0) {
      Alert.alert("Select trips", "Please select at least one trip");
      return;
    }

    await createInvoice({
      client_id: numericClientId,
      tripIds: selectedTrips,
      due_date: new Date().toISOString().split("T")[0],
    });

    setSelectedTrips([]);
    fetchInvoices();
    fetchTrips();
    fetchLedger(numericClientId);
    fetchSummary(numericClientId);
  };

  const handleAddPayment = async () => {
    if (!paymentAmount) {
      Alert.alert("Enter amount");
      return;
    }

    await addPayment({
      client_id: numericClientId,
      invoice_id: 0, // required by hook
      amount: Number(paymentAmount),
      remarks: paymentRemarks,
    });

    setPaymentAmount("");
    setPaymentRemarks("");
    setShowPaymentForm(false);

    fetchLedger(numericClientId);
    fetchSummary(numericClientId);
  };

  /* ---------------- GUARDS ---------------- */
  if (authLoading || clientsLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!user || !client) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-4">
        <Text className="text-muted-foreground mb-4">Client not found</Text>
        <View className="bg-gray-100 p-4 rounded-lg">
          <Text className="font-mono text-xs">Debug Info:</Text>
          <Text className="font-mono text-xs">ID Param: {clientId}</Text>
          <Text className="font-mono text-xs">Parsed ID: {numericClientId}</Text>
          <Text className="font-mono text-xs">User: {user ? "Logged In" : "Null"}</Text>
          <Text className="font-mono text-xs">UID: {firebase_uid}</Text>
          <Text className="font-mono text-xs">Clients Loaded: {clients.length}</Text>
          <Text className="font-mono text-xs">Loading: {clientsLoading ? "Yes" : "No"}</Text>
        </View>
        <TouchableOpacity
          onPress={() => { fetchClients(); fetchInvoices(); fetchTrips(); fetchLedger(numericClientId); }}
          className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Retry Fetch</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go Back</Text>
        </TouchableOpacity>
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

        {/* Ledger Summary */}
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

        {/* Ledger Entries */}
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
                className={`font-semibold ${e.entry_type === "credit"
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                ₹ {e.amount}
              </Text>
            </View>
          ))
        )}

        {/* Invoices */}
        <Text className="text-lg font-semibold mb-3 mt-8">Invoices</Text>

        {clientInvoices.length === 0 ? (
          <Text className="text-muted-foreground mb-6">
            No invoices found.
          </Text>
        ) : (
          clientInvoices.map((invoice: Invoice) => (
            <View
              key={invoice.invoice_id}
              className="bg-card border border-border rounded-xl p-4 mb-3 flex-row justify-between"
            >
              <View>
                <Text className="font-semibold">{invoice.invoice_number}</Text>
                <Text className="text-xs text-muted-foreground">
                  Due {invoice.due_date}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-semibold">
                  ₹ {invoice.total_amount}
                </Text>
                <StatusPill status={invoice.status} />
              </View>
            </View>
          ))
        )}

        {/* Trips (UNCHANGED) */}
        <View className="mt-8 mb-24">
          <Text className="text-lg font-semibold mb-3">Trip History</Text>

          <View className="flex-row gap-2 mb-4">
            {["all", "uninvoiced", "invoiced"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setTripFilter(f as any)}
                className={`px-3 py-1.5 rounded-full ${tripFilter === f ? "bg-blue-600" : "bg-muted"
                  }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${tripFilter === f ? "text-white" : "text-foreground"
                    }`}
                >
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tripFilter === "uninvoiced" && uninvoicedTrips.length > 0 && (
            <TouchableOpacity
              onPress={handleGenerateInvoice}
              className="bg-blue-600 py-2.5 rounded-lg mb-4 items-center"
            >
              <Text className="text-white font-semibold">
                Generate Invoice ({selectedTrips.length})
              </Text>
            </TouchableOpacity>
          )}

          {filteredTrips.map((trip: Trip) => (
            <TouchableOpacity
              key={trip.trip_id}
              disabled={trip.invoiced_status === "invoiced"}
              onPress={() => toggleTripSelection(trip.trip_id)}
              className={`bg-card border rounded-xl p-4 mb-3 ${selectedTrips.includes(trip.trip_id)
                ? "border-blue-600"
                : "border-border"
                }`}
            >
              <View className="flex-row justify-between mb-1">
                <Text className="font-semibold">Trip #{trip.trip_id}</Text>
                <Text className="font-semibold">₹ {trip.cost_of_trip}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
        className={`text-lg font-bold ${green ? "text-green-600" : red ? "text-red-500" : ""
          }`}
      >
        ₹ {value}
      </Text>
      <Text className="text-[11px] text-muted-foreground mt-1">{label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "paid"
      ? "bg-green-100 text-green-800"
      : status === "partial"
        ? "bg-orange-100 text-orange-800"
        : "bg-red-100 text-red-800";

  return (
    <View className={`px-3 py-1 rounded-full mt-1 ${styles}`}>
      <Text className="text-[11px] font-semibold">
        {status.toUpperCase()}
      </Text>
    </View>
  );
}
