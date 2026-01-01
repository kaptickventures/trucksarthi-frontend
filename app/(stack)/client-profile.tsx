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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";


import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import useClients from "../../hooks/useClient";
import { LedgerEntry, useClientLedger } from "../../hooks/useClientLedger";
import { Invoice, useInvoices } from "../../hooks/useInvoice";
import useTrips, { Trip } from "../../hooks/useTrip";
import useDrivers from "../../hooks/useDriver";
import useTrucks from "../../hooks/useTruck";
import useLocations from "../../hooks/useLocation";

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

const { drivers } = useDrivers(firebase_uid);
const { trucks } = useTrucks(firebase_uid);
const { locations } = useLocations(firebase_uid);


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

  const driverMap = useMemo(
  () =>
    Object.fromEntries(
      drivers.map((d) => [Number(d.driver_id), d.driver_name])
    ),
  [drivers]
);

const truckMap = useMemo(
  () =>
    Object.fromEntries(
      trucks.map((t) => [Number(t.truck_id), t.registration_number])
    ),
  [trucks]
);

const locationMap = useMemo(
  () =>
    Object.fromEntries(
      locations.map((l) => [Number(l.location_id), l.location_name])
    ),
  [locations]
);


  // ✅ ADD — Invoice PDF (same approach as TripLog)
const generateInvoicePDF = async (invoice: Invoice) => {
  try {
    const invoiceTrips = trips.filter(
      (t) =>
        Number(t.client_id) === Number(invoice.client_id) &&
        normalizeInvoiceStatus(t.invoiced_status) === "invoiced"
    );

    const subtotal = invoiceTrips.reduce(
      (acc, t) =>
        acc + Number(t.cost_of_trip) + Number(t.miscellaneous_expense || 0),
      0
    );

    const taxRate = 0.05;
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;

    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      padding: 24px;
      color: #111;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .header p {
      font-size: 12px;
      color: #555;
      margin: 4px 0 12px;
    }
    .divider {
      border-top: 2px solid #2563eb;
      margin: 12px 0;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .billto {
      background: #f0f7ff;
      padding: 12px;
      border-left: 4px solid #2563eb;
      margin-bottom: 16px;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 8px;
      text-align: left;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .right {
      text-align: right;
    }
    .totals {
      margin-top: 12px;
      font-size: 13px;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .grand {
      font-weight: bold;
      color: #2563eb;
      font-size: 15px;
      border-top: 2px solid #2563eb;
      padding-top: 8px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>

<body>

  <div class="header">
    <h1>TruckSarthi</h1>
    <p>Professional Logistics & Transportation</p>
  </div>

  <div class="divider"></div>

  <div class="meta">
    <div>
      <strong>Invoice Number</strong><br />
      ${invoice.invoice_number}
    </div>
    <div>
      <strong>Invoice Date</strong><br />
      ${today}
    </div>
    <div>
      <strong>Total Trips</strong><br />
      ${invoiceTrips.length}
    </div>
  </div>

  <div class="billto">
    <strong>Bill To:</strong><br />
    ${client?.client_name || ""}<br />
    Logistics & Transportation Services
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Route</th>
        <th>Truck</th>
        <th>Driver</th>
        <th class="right">Trip Cost</th>
        <th class="right">Misc Expense</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
  ${invoiceTrips
    .map((t) => {
      const tripTotal =
        Number(t.cost_of_trip) + Number(t.miscellaneous_expense || 0);

      const driverName =
        driverMap[t.driver_id] || "—";

      const truckNumber =
        truckMap[t.truck_id] || "—";

      const route = `${
        locationMap[t.start_location_id] || "—"
      } → ${
        locationMap[t.end_location_id] || "—"
      }`;

      return `
        <tr>
          <td>${t.trip_date}</td>
          <td>${route}</td>
          <td>${truckNumber}</td>
          <td>${driverName}</td>
          <td class="right">₹${Number(
            t.cost_of_trip
          ).toLocaleString()}</td>
          <td class="right">₹${Number(
            t.miscellaneous_expense || 0
          ).toLocaleString()}</td>
          <td class="right"><strong>₹${tripTotal.toLocaleString()}</strong></td>
        </tr>
      `;
    })
    .join("")}
</tbody>

  </table>

  <div class="totals">
    <div>
      <span>Subtotal (${invoiceTrips.length} trips)</span>
      <span>₹${subtotal.toLocaleString()}</span>
    </div>
    <div>
      <span>Tax (5%)</span>
      <span>₹${tax.toLocaleString()}</span>
    </div>
    <div class="grand">
      <span>Grand Total</span>
      <span>₹${grandTotal.toLocaleString()}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>TruckSarthi – Your Trusted Logistics Partner</p>
    <p>Generated on ${new Date().toLocaleString("en-IN")}</p>
  </div>

</body>
</html>
`;

    const { uri } = await Print.printToFileAsync({ html });
    const fileUri = `${FileSystem.documentDirectory}Invoice-${invoice.invoice_number}.pdf`;

    await FileSystem.moveAsync({ from: uri, to: fileUri });
    await Sharing.shareAsync(fileUri);
  } catch (e) {
    console.error(e);
    Alert.alert("Error", "Failed to generate invoice PDF");
  }
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
            key={`${e.entry_id}-${e.entry_date}-${e.amount}`}
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
<TouchableOpacity onPress={() => generateInvoicePDF(inv)}>
  <FileText size={18} color="#2563EB" />
</TouchableOpacity>
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
