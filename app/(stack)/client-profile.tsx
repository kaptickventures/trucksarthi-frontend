import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, ArrowUpRight, Banknote, Building2, ChevronDown, Edit, Eye, FileText, Plus, Share2, Wallet, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";


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

  const {
    entries,
    fetchLedger,
    fetchSummary,
    addPayment,
    updateEntry,
  } = useClientLedger();

  /* ---------------- STATE ---------------- */
  const [activeTab, setActiveTab] = useState<"unbilled" | "billed" | "settled">("unbilled");

  // Payment Form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Transaction Edit
  const [editingTransaction, setEditingTransaction] = useState<LedgerEntry | null>(null);
  const [editTrxAmount, setEditTrxAmount] = useState("");
  const [editTrxRemarks, setEditTrxRemarks] = useState("");
  const [editTrxDate, setEditTrxDate] = useState(new Date());
  const [showEditTrxDatePicker, setShowEditTrxDatePicker] = useState(false);

  const [selectedTrips, setSelectedTrips] = useState<number[]>([]);

  // Edit Client Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });
  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const SCROLL_THRESHOLD = 40;
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
  const { clients, loading: clientsLoading, fetchClients, updateClient } =
    useClients(firebase_uid);

  const { invoices, fetchInvoices, createInvoice } =
    useInvoices(firebase_uid);

  const { trips, fetchTrips } = useTrips(firebase_uid, { autoFetch: false });



  /* ---------------- FETCH (AUTH SAFE) ---------------- */
  useEffect(() => {
    if (!user || !firebase_uid || !numericClientId) return;

    fetchClients();
    fetchInvoices();
    fetchTrips();
    fetchLedger(numericClientId);
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

  // 💰 CALCULATED AMOUNTS
  const unbilledAmount = useMemo(() => {
    return clientTrips
      .filter((t) => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced")
      .reduce((sum, t) => sum + Number(t.cost_of_trip) + Number(t.miscellaneous_expense || 0), 0);
  }, [clientTrips]);

  const billedAmount = useMemo(() => {
    return clientInvoices
      .filter((i) => i.status !== "paid")
      .reduce((sum, i) => sum + Number(i.total_amount), 0);
  }, [clientInvoices]);

  const settledAmount = useMemo(() => {
    return entries
      .filter((e) => e.entry_type === "credit")
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [entries]);

  /* ---------------- ACTIONS ---------------- */
  // Update Payment Date helper
  const onPaymentDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  const onEditTrxDateChange = (event: any, selectedDate?: Date) => {
    setShowEditTrxDatePicker(false);
    if (selectedDate) {
      setEditTrxDate(selectedDate);
    }
  };

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
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || !numericClientId) {
      Alert.alert("Enter amount");
      return;
    }
    if (!paymentRemarks.trim()) {
      Alert.alert("Remarks are mandatory");
      return;
    }

    await addPayment({
      client_id: numericClientId,
      amount: Number(paymentAmount),
      remarks: paymentRemarks,
      date: paymentDate.toISOString(),
    });

    setPaymentAmount("");
    setPaymentRemarks("");
    setPaymentDate(new Date());
    setShowPaymentForm(false);

    fetchLedger(numericClientId);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !editTrxAmount || !numericClientId) return;

    await updateEntry(editingTransaction.entry_id, {
      client_id: numericClientId,
      amount: Number(editTrxAmount),
      remarks: editTrxRemarks,
      date: editTrxDate.toISOString(),
    });

    setEditingTransaction(null);
    fetchLedger(numericClientId);
  };

  const openEditTransaction = (entry: LedgerEntry) => {
    setEditingTransaction(entry);
    setEditTrxAmount(entry.amount.toString());
    setEditTrxRemarks(entry.remarks || "");
    setEditTrxDate(new Date(entry.entry_date));
  };

  const handleSettleInvoice = async (invoice: Invoice) => {
    // Open payment modal pre-filled
    setPaymentAmount(invoice.total_amount.toString());
    setPaymentRemarks(`Settlement for Invoice #${invoice.invoice_number}`);
    setPaymentDate(new Date());
    setShowPaymentForm(true);
  };

  // Edit Client Modal Handlers
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, state) => state.y0 < SCROLL_THRESHOLD,
      onPanResponderMove: (_, state) => {
        if (state.dy > 0) translateY.setValue(state.dy);
      },
      onPanResponderRelease: (_, state) => {
        if (state.dy > 120) closeEditModal();
        else
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
      },
    })
  ).current;

  const openEditModal = () => {
    if (client) {
      setEditFormData({
        client_name: client.client_name || "",
        contact_person_name: client.contact_person_name || "",
        contact_number: client.contact_number || "",
        alternate_contact_number: client.alternate_contact_number || "",
        email_address: client.email_address || "",
        office_address: client.office_address || "",
      });
      setShowEditModal(true);
    }
  };

  const closeEditModal = () => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      setShowEditModal(false);
    });
  };

  const handleUpdateClient = async () => {
    if (!editFormData.client_name || !editFormData.contact_number) {
      Alert.alert("⚠️ Missing Fields", "Please fill all required fields.");
      return;
    }

    if (!numericClientId) return;

    try {
      await updateClient(numericClientId, editFormData);
      Alert.alert("Success", "Client updated successfully.");
      closeEditModal();
      fetchClients();
    } catch {
      Alert.alert("Error", "Failed to update client.");
    }
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

            {/* EDIT CLIENT BUTTON */}
            <TouchableOpacity onPress={openEditModal} className="bg-muted p-2 rounded-full">
              <Edit size={16} color="black" />
            </TouchableOpacity>
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
          <SummaryCard label="Billed Amount" value={billedAmount} />
          <SummaryCard label="Unbilled Amount" value={unbilledAmount} />
          <SummaryCard label="Settled Amount" value={settledAmount} green />
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
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowPaymentForm(false)}
              className="flex-1 bg-black/40 justify-end"
            >
              <TouchableOpacity
                activeOpacity={1}
                className="bg-background rounded-t-3xl px-6 pt-4 pb-10"
              >
                <View className="items-center mb-6">
                  <View className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                </View>

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

                {/* DATE PICKER */}
                <View className="mb-6">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="flex-row items-center bg-muted rounded-2xl px-4 py-3"
                  >
                    <Text className="text-base font-medium">
                      {paymentDate.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={paymentDate}
                      mode="date"
                      display="default"
                      onChange={onPaymentDateChange}
                    />
                  )}
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
                </View>

                {/* REMARKS */}
                <View className="mb-8">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Remarks *
                  </Text>

                  <View className="flex-row items-center bg-muted rounded-2xl px-4 py-3">
                    <FileText size={18} color="#64748b" />
                    <TextInput
                      placeholder="UPI / Cheque / Notes (Mandatory)"
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

        {/* Edit Transaction Modal */}
        <Modal
          visible={!!editingTransaction}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingTransaction(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center items-center bg-black/50 px-6"
          >
            <View className="bg-background w-full rounded-2xl p-6">
              <Text className="text-lg font-bold mb-4">Edit Transaction</Text>

              {/* DATE */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-muted-foreground mb-1">Date</Text>
                <TouchableOpacity
                  onPress={() => setShowEditTrxDatePicker(true)}
                  className="p-3 bg-muted rounded-xl"
                >
                  <Text>{editTrxDate.toDateString()}</Text>
                </TouchableOpacity>
                {showEditTrxDatePicker && (
                  <DateTimePicker
                    value={editTrxDate}
                    mode="date"
                    display="default"
                    onChange={onEditTrxDateChange}
                  />
                )}
              </View>

              {/* AMOUNT */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-muted-foreground mb-1">Amount</Text>
                <TextInput
                  value={editTrxAmount}
                  onChangeText={setEditTrxAmount}
                  keyboardType="numeric"
                  className="p-3 bg-muted rounded-xl font-bold"
                />
              </View>

              {/* REMARKS */}
              <View className="mb-6">
                <Text className="text-xs font-semibold text-muted-foreground mb-1">Remarks</Text>
                <TextInput
                  value={editTrxRemarks}
                  onChangeText={setEditTrxRemarks}
                  className="p-3 bg-muted rounded-xl"
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setEditingTransaction(null)} className="flex-1 p-3 bg-muted rounded-xl items-center">
                  <Text className="font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateTransaction} className="flex-1 p-3 bg-green-600 rounded-xl items-center">
                  <Text className="font-semibold text-white">Update</Text>
                </TouchableOpacity>
              </View>
            </View>
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

                  <TouchableOpacity
                    className="flex-1"
                    onPress={() => openEditTransaction(e)}
                  >
                    <Text className="font-bold text-sm">
                      {isCredit
                        ? (e.remarks || "Payment")
                        : (e.remarks?.includes("#")
                          ? `Invoice #${e.remarks.split("#")[1].split(" ")[0]}`
                          : (e.entry_id?.startsWith("INV") ? `Invoice #${e.entry_id.split("-")[1]}` : "Invoice")
                        )
                      }
                    </Text>
                    <Text className="text-[12px] text-muted-foreground mt-0.5">
                      {new Date(e.entry_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>
                  </TouchableOpacity>

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
            <Text className="text-lg font-bold">Billing</Text>
          </View>

          <View className="flex-row gap-2 mb-4">
            {(["unbilled", "billed", "settled"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full ${activeTab === tab ? "bg-green-600" : "bg-muted"}`}
              >
                <Text className={`text-xs font-bold ${activeTab === tab ? "text-white" : "text-foreground"}`}>
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CONTENT BASED ON TAB */}
          {activeTab === 'unbilled' && (
            <View>
              {unbilledAmount === 0 && <Text className="text-muted-foreground p-4 text-center">No unbilled trips.</Text>}
              {clientTrips
                .filter(t => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced")
                .map((trip) => {
                  const isSelected = selectedTrips.includes(trip.trip_id);
                  return (
                    <TouchableOpacity
                      key={trip.trip_id}
                      onPress={() => toggleTripSelection(trip.trip_id)}
                      activeOpacity={0.8}
                      className={`bg-card rounded-2xl mb-3 border ${isSelected ? "border-green-600 bg-green-50" : "border-transparent"}`}
                    >
                      <View className="flex-row items-center p-4">
                        <View className={`w-6 h-6 rounded-md mr-3 items-center justify-center border ${isSelected ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-sm">{locationMap[trip.start_location_id]} → {locationMap[trip.end_location_id]}</Text>
                          <Text className="text-xs text-muted-foreground">{trip.trip_date?.split("T")[0]}</Text>
                        </View>
                        <Text className="font-bold">₹{Number(trip.cost_of_trip).toLocaleString()}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}

              {selectedTrips.length > 0 && (
                <TouchableOpacity onPress={handleGenerateInvoice} className="bg-green-600 rounded-2xl py-4 items-center mt-4">
                  <Text className="text-white font-bold">Generate Invoice ({selectedTrips.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'billed' && (
            <View>
              {clientInvoices.filter(i => i.status !== 'paid').length === 0 && <Text className="text-muted-foreground p-4 text-center">No pending invoices.</Text>}
              {clientInvoices.filter(i => i.status !== 'paid').map(inv => (
                <View key={inv.invoice_id} className="bg-card rounded-xl p-4 mb-3 border border-border">
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-bold">Invoice #{inv.invoice_number}</Text>
                    <Text className="font-bold text-red-600">₹{Number(inv.total_amount).toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-muted-foreground">Due: {inv.due_date}</Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity onPress={() => generateInvoicePDF(inv)}><Eye size={18} color="#64748b" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => generateInvoicePDF(inv)}><Share2 size={18} color="#64748b" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleSettleInvoice(inv)} className="bg-green-100 px-3 py-1 rounded-md">
                        <Text className="text-xs font-bold text-green-700">Settle</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'settled' && (
            <View>
              {clientInvoices.filter(i => i.status === 'paid').length === 0 && <Text className="text-muted-foreground p-4 text-center">No settled invoices.</Text>}
              {clientInvoices.filter(i => i.status === 'paid').map(inv => (
                <View key={inv.invoice_id} className="bg-card rounded-xl p-4 mb-3 opacity-80">
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-bold text-muted-foreground">Invoice #{inv.invoice_number}</Text>
                    <Text className="font-bold text-green-600">₹{Number(inv.total_amount).toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-muted-foreground">Paid on {inv.invoice_date?.split("T")[0]}</Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity onPress={() => generateInvoicePDF(inv)}><Eye size={18} color="#64748b" /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

        </View>

        {/* Trip History Section */}
        <View className="mt-8 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Trip History</Text>
            <Text className="text-xs text-muted-foreground">
              {clientTrips.length} trips
            </Text>
          </View>

          {clientTrips.length === 0 ? (
            <Text className="text-muted-foreground p-4 text-center">No trips yet.</Text>
          ) : (
            clientTrips.map((trip) => {
              const status = normalizeInvoiceStatus(trip.invoiced_status);
              const isInvoiced = status === "invoiced";

              return (
                <View
                  key={trip.trip_id}
                  className={`bg-card rounded-2xl mb-3 p-4 ${isInvoiced ? "opacity-60" : ""}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-sm mb-1">
                        {locationMap[trip.start_location_id] || "Unknown"} → {locationMap[trip.end_location_id] || "Unknown"}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {trip.trip_date?.split("T")[0]} • Trip #{trip.trip_id}
                      </Text>
                    </View>

                    <View className="items-end ml-4">
                      <Text className="font-bold text-base">
                        ₹{Number(trip.cost_of_trip).toLocaleString()}
                      </Text>
                      <View
                        className={`mt-1 px-2.5 py-0.5 rounded-full ${isInvoiced ? "bg-red-100" : "bg-green-100"}`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${isInvoiced ? "text-red-700" : "text-green-700"}`}
                        >
                          {isInvoiced ? "BILLED" : "UNBILLED"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

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

      {/* Edit Client Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-background" onPress={closeEditModal}>
          <Animated.View
            {...panResponder.panHandlers}
            className="absolute bottom-0 w-full bg-background rounded-t-3xl"
            style={{
              height: "100%",
              paddingHorizontal: 20,
              paddingTop: insets.top + 20,
              transform: [{ translateY }],
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
            >
              <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />

              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-2xl font-semibold">Edit Client</Text>
                <TouchableOpacity onPress={closeEditModal}>
                  <X size={28} color="#888" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Client Name */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    Client Name <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-input rounded-xl p-3"
                    value={editFormData.client_name}
                    onChangeText={(val) =>
                      setEditFormData({ ...editFormData, client_name: val })
                    }
                    placeholder="Enter client name"
                    placeholderTextColor="#888"
                  />
                </View>

                {/* Contact Person Name */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    Contact Person Name
                  </Text>
                  <TextInput
                    className="border border-input rounded-xl p-3"
                    value={editFormData.contact_person_name}
                    onChangeText={(val) =>
                      setEditFormData({ ...editFormData, contact_person_name: val })
                    }
                    placeholder="Enter contact person name"
                    placeholderTextColor="#888"
                  />
                </View>

                {/* Contact Number */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    Contact Number <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-input rounded-xl p-3"
                    value={editFormData.contact_number}
                    onChangeText={(val) =>
                      setEditFormData({ ...editFormData, contact_number: val })
                    }
                    placeholder="Enter contact number"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Alternate Contact Number */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    Alternate Contact Number
                  </Text>
                  <TextInput
                    className="border border-input rounded-xl p-3"
                    value={editFormData.alternate_contact_number}
                    onChangeText={(val) =>
                      setEditFormData({ ...editFormData, alternate_contact_number: val })
                    }
                    placeholder="Enter alternate contact number"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Email Address */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    Email Address
                  </Text>
                  <TextInput
                    className="border border-input rounded-xl p-3"
                    value={editFormData.email_address}
                    onChangeText={(val) =>
                      setEditFormData({ ...editFormData, email_address: val })
                    }
                    placeholder="Enter email address"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                  />
                </View>

                {/* Office Address */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    Office Address
                  </Text>
                  <TextInput
                    className="border border-input rounded-xl p-3"
                    value={editFormData.office_address}
                    onChangeText={(val) =>
                      setEditFormData({ ...editFormData, office_address: val })
                    }
                    placeholder="Enter office address"
                    placeholderTextColor="#888"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleUpdateClient}
                  className="bg-primary p-4 rounded-xl mb-3"
                >
                  <Text className="text-center text-primary-foreground font-semibold">
                    Update
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeEditModal}
                  className="border border-border p-4 rounded-xl"
                >
                  <Text className="text-center text-muted-foreground">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </Pressable>
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
