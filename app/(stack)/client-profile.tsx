import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, ArrowUpRight, Banknote, Building2, ChevronDown, FileText, Plus, Wallet } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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


import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import useClients from "../../hooks/useClient";
import { LedgerEntry, useClientLedger } from "../../hooks/useClientLedger";
import useDrivers from "../../hooks/useDriver";
import { Invoice, useInvoices } from "../../hooks/useInvoice";
import useLocations from "../../hooks/useLocation";
import useTrips, { Trip } from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";

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

  useEffect(() => {
    setSelectedTrips([]);
  }, [tripFilter]);

  const [summary, setSummary] = useState({
    total_debits: 0,
    total_credits: 0,
    outstanding: 0,
  });

  const [selectedTrips, setSelectedTrips] = useState<number[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [visibleEntries, setVisibleEntries] = useState(5);

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

            const route = `${locationMap[t.start_location_id] || "—"
              } → ${locationMap[t.end_location_id] || "—"
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
    fetchTrips();
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

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Client Card */}
        {/* Client Card */}
        <View className="bg-card rounded-2xl p-4 mb-6">
          <View className="flex-row items-center ">
            <View className="w-14 h-14 bg-secondary rounded-full items-center justify-center mr-4">
              <Building2 size={26} color="#16a34a" />
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-base font-semibold">
                {client.client_name}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {client.contact_person_name || "—"}
              </Text>
            </View>
          </View>

          {/* ACTION ROW */}
          <View className="flex-row gap-4 mt-4">
            {/* CALL */}
            <TouchableOpacity
              onPress={() =>
                client.contact_number &&
                Linking.openURL(`tel:${client.contact_number}`)
              }
              className="flex-1 bg-muted py-2 rounded-xl items-center"
            >
              <Text className="font-semibold text-sm">📞 Call</Text>
            </TouchableOpacity>

            {/* WHATSAPP */}
            <TouchableOpacity
              onPress={() =>
                client.contact_number &&
                Linking.openURL(
                  `https://wa.me/91${client.contact_number}?text=Hello ${client.client_name}`
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




        {/* Summary */}
        <View className="flex-row gap-2 mb-6">
          <SummaryCard label="Billed" value={summary.total_debits} />
          <SummaryCard label="Received" value={summary.total_credits} green />
          <SummaryCard label="Outstanding" value={summary.outstanding} red />
        </View>

        {/* Add Payment Button - Full Width Bar */}
        <TouchableOpacity
          onPress={() => setShowPaymentForm(true)}
          className="bg-green-600 rounded-2xl py-4 flex-row items-center justify-center mb-6"
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-bold ml-2">Add Payment Entry</Text>
        </TouchableOpacity>


        {/* Payment Modal */}
        {/* Payment Modal */}
        <Modal
          visible={showPaymentForm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaymentForm(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 mb-8"
          >
            {/* BACKDROP */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowPaymentForm(false)}
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
                    <Text className="text-xl font-bold">Add Payment</Text>
                    <Text className="text-sm text-muted-foreground mt-0.5">
                      {client.client_name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowPaymentForm(false)}
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

                  <View className="flex-row items-center bg-muted rounded-2xl px-4 py-3">
                    <Banknote size={20} color="#16a34a" />
                    <TextInput
                      placeholder="0"
                      keyboardType="numeric"
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      className="flex-1 ml-3 text-xl font-bold"
                      placeholderTextColor="#94a3b8"
                    />
                    <Text className="text-xs font-semibold text-muted-foreground">
                      INR
                    </Text>
                  </View>

                  {/* QUICK AMOUNT PILLS */}
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {[5000, 10000, 25000, 50000, 100000].map((amt) => {
                      const active = paymentAmount === amt.toString();

                      return (
                        <TouchableOpacity
                          key={amt}
                          onPress={() => setPaymentAmount(amt.toString())}
                          className={`px-4 py-2 rounded-full ${active
                            ? "bg-green-600"
                            : "bg-muted"
                            }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${active
                              ? "text-white"
                              : "text-foreground"
                              }`}
                          >
                            ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* REMARKS */}
                <View className="mb-8">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Remarks
                  </Text>

                  <View className="flex-row items-center bg-muted rounded-2xl px-4 py-3">
                    <FileText size={18} color="#64748b" />
                    <TextInput
                      placeholder="UPI / Cheque / Notes"
                      value={paymentRemarks}
                      onChangeText={setPaymentRemarks}
                      className="flex-1 ml-3 text-sm"
                      placeholderTextColor="#94a3b8"
                      multiline
                    />
                  </View>
                </View>

                {/* CTA */}
                <TouchableOpacity
                  onPress={handleAddPayment}
                  activeOpacity={0.9}
                  className="bg-green-600 py-4 rounded-2xl items-center"
                >
                  <Text className="text-white font-bold text-base">
                    Save Payment
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>



        {/* Ledger */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold">Recent Transactions</Text>
        </View>

        {entries.length === 0 ? (
          <View className="bg-card rounded-2xl p-8 items-center justify-center mb-6">
            <Text className="text-muted-foreground">No transactions yet</Text>
          </View>
        ) : (
          <View className="bg-card rounded-2xl overflow-hidden mb-6">
            {entries.slice(0, visibleEntries).map((e: LedgerEntry, index: number) => {
              const isCredit = e.entry_type === "credit";
              return (
                <View
                  key={`${e.entry_id}-${e.entry_date}-${e.amount}`}
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
                    <Text className="font-bold text-sm">
                      {isCredit
                        ? "Payment Received"
                        : (e.remarks?.includes("#")
                          ? `Invoice #${e.remarks.split("#")[1].split(" ")[0]}`
                          : (e.entry_id?.startsWith("INV") ? `Invoice #${e.entry_id.split("-")[1]}` : "Invoice")
                        )
                      }
                    </Text>
                    <Text className="text-[12px] text-muted-foreground mt-0.5">
                      {e.entry_date?.split("T")[0] || e.entry_date} {e.remarks ? `${e.remarks}` : ""}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className={`font-bold ${isCredit ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {isCredit ? "+" : "-"}₹{Number(e.amount).toLocaleString()}
                  </Text>
                </View>
              );
            })}

            {entries.length > visibleEntries && (
              <TouchableOpacity
                onPress={() => setVisibleEntries(prev => prev + 10)}
                className="py-3 items-center flex-row justify-center bg-muted/30"
              >
                <Text className="text-green-600 text-xs font-semibold mr-1">Load More Transactions</Text>
                <ChevronDown size={14} color="#16a34a" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="mt-8 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Trip History</Text>
            <Text className="text-xs text-muted-foreground">
              {filteredTrips.length} trips
            </Text>
          </View>

          <View className="flex-row gap-2 mb-4">
            {["all", "uninvoiced", "invoiced"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setTripFilter(f as any)}
                className={`px-3 py-1.5 rounded-full ${tripFilter === f ? "bg-green-600" : "bg-muted"
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

          {filteredTrips.map((trip: Trip, index) => {
            const status = normalizeInvoiceStatus(trip.invoiced_status);
            const isUninvoiced = status === "not_invoiced";
            const isSelected = selectedTrips.includes(trip.trip_id);

            return (
              <TouchableOpacity
                key={trip.trip_id}
                disabled={!isUninvoiced}
                onPress={() => isUninvoiced && toggleTripSelection(trip.trip_id)}
                activeOpacity={0.85}
                className={`bg-card rounded-2xl mb-3 ${isSelected ? "ring-1 ring-green-600" : ""
                  } ${!isUninvoiced ? "opacity-50" : ""}`}
              >
                <View className="flex-row items-center p-4">
                  {/* CHECKBOX */}
                  {isUninvoiced && (
                    <View
                      className={`w-8 h-8 p-2rounded-full items-center justify-center mr-4 ${isSelected
                        ? "bg-green-600"
                        : "border border-green-600"
                        }`}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="white" />
                      )}
                    </View>
                  )}

                  {/* CONTENT */}
                  <View className="flex-1">
                    {/* ROUTE */}
                    <Text className="font-semibold text-sm mb-1" numberOfLines={1}>
                      {locationMap[trip.start_location_id] || "Unknown"} →{" "}
                      {locationMap[trip.end_location_id] || "Unknown"}
                    </Text>

                    {/* META */}
                    <Text className="text-xs text-muted-foreground">
                      {trip.trip_date?.split("T")[0] || trip.trip_date} • Trip #{trip.trip_id}
                    </Text>
                  </View>

                  {/* AMOUNT + STATUS */}
                  <View className="items-end ml-4">
                    <Text className="font-bold text-base">
                      ₹{Number(trip.cost_of_trip).toLocaleString()}
                    </Text>

                    <View
                      className={`mt-1 px-2.5 py-0.5 rounded-full ${isUninvoiced ? "bg-green-100" : "bg-red-100"
                        }`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${isUninvoiced ? "text-green-700" : "text-red-700"
                          }`}
                      >
                        {isUninvoiced ? "UNINVOICED" : "INVOICED"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {selectedTrips.length > 0 && (
            <View className="mt-4 mb-6">
              <TouchableOpacity
                onPress={handleGenerateInvoice}
                activeOpacity={0.9}
                className="bg-green-600 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold text-base">
                  Generate Invoice ({selectedTrips.length} trips)
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
                <FileText size={18} color="#16a34a" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* FABs Container */}
      {!showPaymentForm && (
        <View className="absolute bottom-6 right-6 gap-3">
          {/* ADD PAYMENT FAB */}
          <TouchableOpacity
            onPress={() => setShowPaymentForm(true)}
            className="bg-green-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
            style={{ elevation: 5 }}
          >
            <Wallet size={24} color="white" />
          </TouchableOpacity>

        </View>
      )}
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
        className={`text-lg font-bold ${green
          ? "text-green-600"
          : red
            ? "text-red-600"
            : "text-card-foreground"
          }`}
      >
        ₹{Number(value).toLocaleString()}
      </Text>
    </View>
  );
}
