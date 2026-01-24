import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, Banknote, Building2, Edit, FileText, Plus, Share2, X } from "lucide-react-native";
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
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import useClients from "../../hooks/useClient";
import { ClientLedger, useClientLedger } from "../../hooks/useClientLedger";
import useDrivers from "../../hooks/useDriver";
import { Invoice, useInvoices } from "../../hooks/useInvoice";
import useLocations from "../../hooks/useLocation";
import useTrips, { Trip } from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";
import { useUser } from "../../hooks/useUser";
import { THEME } from "../../theme";

export default function ClientProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? THEME.dark : THEME.light;
  const { user, loading: userLoading } = useUser();

  /* ---------------- ROUTE PARAM ---------------- */
  const { clientId } = useLocalSearchParams<{ clientId?: string | string[] }>();

  const id = useMemo(() => {
    if (!clientId) return undefined;
    return Array.isArray(clientId) ? clientId[0] : clientId;
  }, [clientId]);

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
  const [editingTransaction, setEditingTransaction] = useState<ClientLedger | null>(null);
  const [editTrxAmount, setEditTrxAmount] = useState("");
  const [editTrxRemarks, setEditTrxRemarks] = useState("");
  const [editTrxDate, setEditTrxDate] = useState(new Date());
  const [showEditTrxDatePicker, setShowEditTrxDatePicker] = useState(false);

  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

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

  const { drivers } = useDrivers();
  const { trucks } = useTrucks();
  const { locations } = useLocations();


  const getId = (obj: any): string => (typeof obj === "object" ? obj?._id : obj);

  const toggleTripSelection = (tripId: string) => {
    setSelectedTrips((prev) =>
      prev.includes(tripId)
        ? prev.filter((id) => id !== tripId)
        : [...prev, tripId]
    );
  };

  /* ---------------- DATA HOOKS ---------------- */
  const { clients, loading: clientsLoading, fetchClients, updateClient } =
    useClients();

  const { invoices, fetchInvoices, createInvoice } =
    useInvoices();

  const { trips, fetchTrips } = useTrips({ autoFetch: false });


  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!id) return;

    fetchClients();
    fetchInvoices();
    fetchTrips();
    fetchLedger(id);
  }, [id]);

  /* ---------------- HELPERS ---------------- */
  const normalizeInvoiceStatus = (status: any) => {
    if (!status) return "not_invoiced";
    return status.toString().toLowerCase().replace(" ", "_");
  };

  const driverMap = useMemo(
    () =>
      Object.fromEntries(
        drivers.map((d) => [d._id, d.driver_name])
      ),
    [drivers]
  );

  const truckMap = useMemo(
    () =>
      Object.fromEntries(
        trucks.map((t) => [t._id, t.registration_number])
      ),
    [trucks]
  );

  const locationMap = useMemo(
    () =>
      Object.fromEntries(
        locations.map((l) => [l._id, l.location_name])
      ),
    [locations]
  );


  // ✅ ADD — Invoice PDF (same approach as TripLog)
  const generateInvoicePDF = async (invoice: Invoice) => {
    try {
      const invoiceTrips = trips.filter(
        (t) =>
          getId(t.client) === getId(invoice.client) &&
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
      ${invoice.invoice_number || "—"}
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
              driverMap[getId(t.driver)] || "—";

            const truckNumber =
              truckMap[getId(t.truck)] || "—";

            const route = `${locationMap[getId(t.start_location)] || "—"
              } → ${locationMap[getId(t.end_location)] || "—"
              }`;

            return `
        <tr>
          <td>${t.trip_date ? String(t.trip_date).split("T")[0] : "—"}</td>
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
      const fileUri = `${FileSystem.documentDirectory}Invoice-${invoice.invoice_number || "N-A"}.pdf`;

      await FileSystem.moveAsync({ from: uri, to: fileUri });
      await Sharing.shareAsync(fileUri);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to generate invoice PDF");
    }
  };



  /* ---------------- DERIVED ---------------- */
  const client = useMemo(() => {
    if (!id) return undefined;
    return clients.find(
      (c) => c._id === id
    );
  }, [clients, id]);

  const clientInvoices = invoices.filter(
    (i: Invoice) => getId(i.client) === id
  );

  const clientTrips = trips.filter(
    (t: Trip) => getId(t.client) === id
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
      .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
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
    if (!selectedTrips.length || !id) {
      Alert.alert("Select uninvoiced trips");
      return;
    }

    await createInvoice({
      client_id: id,
      tripIds: selectedTrips,
      due_date: new Date().toISOString().split("T")[0],
    });

    setSelectedTrips([]);
    fetchInvoices();
    fetchTrips();
    fetchLedger(id);
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || !id) {
      Alert.alert("Enter amount");
      return;
    }
    if (!paymentRemarks.trim()) {
      Alert.alert("Remarks are mandatory");
      return;
    }

    await addPayment({
      client_id: id,
      amount: Number(paymentAmount),
      remarks: paymentRemarks,
      date: paymentDate.toISOString(),
    });

    setPaymentAmount("");
    setPaymentRemarks("");
    setPaymentDate(new Date());
    setShowPaymentForm(false);

    fetchLedger(id);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !editTrxAmount || !id) return;

    await updateEntry(editingTransaction._id, {
      client_id: id,
      amount: Number(editTrxAmount),
      remarks: editTrxRemarks,
      date: editTrxDate.toISOString(),

    });

    setEditingTransaction(null);
    fetchLedger(id);
  };

  const openEditTransaction = (entry: ClientLedger) => {
    setEditingTransaction(entry);
    setEditTrxAmount(entry.amount.toString());
    setEditTrxRemarks(entry.remarks || "");
    const parsedDate = new Date(entry.entry_date);
    setEditTrxDate(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
  };

  const handleSettleInvoice = async (invoice: Invoice) => {
    // Open payment modal pre-filled
    setPaymentAmount((invoice.total_amount || 0).toString());
    setPaymentRemarks(`Settlement for Invoice #${invoice.invoice_number || "—"}`);
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

    if (!id) return;

    try {
      await updateClient(id, editFormData);
      Alert.alert("Success", "Client updated successfully.");
      closeEditModal();
      fetchClients();
    } catch {
      Alert.alert("Error", "Failed to update client.");
    }
  };

  /* ---------------- GUARDS ---------------- */
  if (userLoading || clientsLoading || !id) {
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
                    <TextInput
                      placeholder="Enter remarks..."
                      value={paymentRemarks}
                      onChangeText={setPaymentRemarks}
                      className="flex-1 text-base"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                {/* SUBMIT */}
                <TouchableOpacity
                  onPress={handleAddPayment}
                  className="bg-green-600 rounded-2xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-base">
                    Save Payment
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        {/* ... (Existing Tabs and Lists Code kept same as before but inside the component) ... */}
        {/* For brevity, assuming the rest of the component (tabs, lists) is handled or you want me to reproduce it all. 
            Since I am replacing the file content, I must reproduce it all.
        */}

        {/* TABS HEADER */}
        <View className="flex-row bg-muted/50 p-1 rounded-xl mb-4">
          {(["unbilled", "billed", "settled"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 items-center rounded-lg ${activeTab === tab ? "bg-background shadow-sm" : ""
                }`}
            >
              <Text
                className={`text-xs font-bold uppercase ${activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground"
                  }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 1) UNBILLED TRIPS */}
        {activeTab === "unbilled" && (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-bold text-lg">Unbilled Trips</Text>
              {selectedTrips.length > 0 && (
                <TouchableOpacity
                  onPress={handleGenerateInvoice}
                  className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
                >
                  <FileText size={14} color="white" />
                  <Text className="text-white font-bold text-xs ml-2">
                    Generate Invoice ({selectedTrips.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {clientTrips.filter(
              (t) => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced"
            ).length === 0 ? (
              <Text className="text-center text-muted-foreground py-8">
                No unbilled trips
              </Text>
            ) : (
              clientTrips
                .filter(
                  (t) =>
                    normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced"
                )
                .map((trip) => {
                  const isSelected = selectedTrips.includes(trip._id);
                  return (
                    <TouchableOpacity
                      key={trip._id}
                      onPress={() => toggleTripSelection(trip._id)}
                      activeOpacity={0.9}
                      className={`p-4 rounded-xl mb-3 border ${isSelected
                        ? "bg-blue-50 border-blue-200"
                        : "bg-card border-transparent"
                        }`}
                    >
                      <View className="flex-row justify-between mb-2">
                        <Text className="font-bold text-base">
                          {trip.trip_date ? String(trip.trip_date).split("T")[0] : "—"}
                        </Text>
                        <Text className="font-bold text-blue-600">
                          ₹{Number(trip.cost_of_trip).toLocaleString()}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted-foreground">
                        {locationMap[getId(trip.start_location)]} →{" "}
                        {locationMap[getId(trip.end_location)]}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        Truck: {truckMap[getId(trip.truck)]} • Driver:{" "}
                        {driverMap[getId(trip.driver)]}
                      </Text>
                    </TouchableOpacity>
                  );
                })
            )}
          </View>
        )}

        {/* 2) BILLED INVOICES */}
        {activeTab === "billed" && (
          <View>
            {clientInvoices.length === 0 ? (
              <Text className="text-center text-muted-foreground py-8">
                No invoices found
              </Text>
            ) : (
              clientInvoices.map((inv) => (
                <View
                  key={inv._id}
                  className="bg-card p-4 rounded-xl mb-3 border border-border"
                >
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-bold text-base">
                      #{inv.invoice_number || "—"}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded text-[10px] ${inv.status === "paid" ? "bg-green-100" : "bg-yellow-100"
                        }`}
                    >
                      <Text
                        className={`text-[10px] font-bold uppercase ${inv.status === "paid"
                          ? "text-green-700"
                          : "text-yellow-700"
                          }`}
                      >
                        {inv.status || "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-2xl font-bold">
                      ₹{Number(inv.total_amount || 0).toLocaleString()}
                    </Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => generateInvoicePDF(inv)}
                        className="bg-secondary p-2 rounded-lg"
                      >
                        <Share2 size={18} color={isDark ? "white" : "black"} />
                      </TouchableOpacity>

                      {inv.status !== "paid" && (
                        <TouchableOpacity
                          onPress={() => handleSettleInvoice(inv)}
                          className="bg-green-600 px-3 py-2 rounded-lg"
                        >
                          <Text className="text-white font-bold text-xs">
                            Settle
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text className="text-xs text-muted-foreground mt-2">
                    Date: {inv.due_date ? String(inv.due_date).split("T")[0] : "—"}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* 3) SETTLED (Ledger) */}
        {activeTab === "settled" && (
          <View>
            {entries.length === 0 ? (
              <Text className="text-center text-muted-foreground py-8">
                No transactions found
              </Text>
            ) : (
              entries.map((entry) => {
                const isCredit = entry.entry_type === "credit";
                return (
                  <TouchableOpacity
                    key={entry._id}
                    onLongPress={() => openEditTransaction(entry)}
                    className="bg-card p-4 rounded-xl mb-3 flex-row items-center border border-border"
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isCredit ? "bg-green-100" : "bg-blue-100"
                        }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft size={20} color="#16a34a" />
                      ) : (
                        <FileText size={20} color="#2563eb" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-sm">
                        {isCredit
                          ? "Payment Received"
                          : `Invoice #${entry.remarks?.replace(
                            "Generated from Invoice #",
                            ""
                          )}`}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {String(entry.entry_date).split("T")[0]} • {entry.remarks}
                      </Text>
                    </View>
                    <Text
                      className={`font-bold ${isCredit ? "text-green-600" : "text-foreground"
                        }`}
                    >
                      {isCredit ? "+" : ""}₹
                      {Number(entry.amount).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}

            {/* EDIT TRANSACTION MODAL */}
            <Modal
              visible={!!editingTransaction}
              transparent
              animationType="fade"
              onRequestClose={() => setEditingTransaction(null)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-end"
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setEditingTransaction(null)}
                  className="flex-1 bg-black/40"
                />
                <View className="bg-background rounded-t-3xl p-6">
                  <Text className="text-lg font-bold mb-4">
                    Edit Transaction
                  </Text>

                  {/* DATE */}
                  <TouchableOpacity
                    onPress={() => setShowEditTrxDatePicker(true)}
                    className="bg-muted p-3 rounded-xl mb-4"
                  >
                    <Text>
                      {editTrxDate.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showEditTrxDatePicker && (
                    <DateTimePicker
                      value={editTrxDate}
                      mode="date"
                      display="default"
                      onChange={onEditTrxDateChange}
                    />
                  )}

                  <TextInput
                    value={editTrxAmount}
                    onChangeText={setEditTrxAmount}
                    keyboardType="numeric"
                    placeholder="Amount"
                    className="bg-muted p-3 rounded-xl mb-4 text-lg font-bold"
                  />
                  <TextInput
                    value={editTrxRemarks}
                    onChangeText={setEditTrxRemarks}
                    placeholder="Remarks"
                    className="bg-muted p-3 rounded-xl mb-6"
                  />

                  <TouchableOpacity
                    onPress={handleUpdateTransaction}
                    className="bg-primary p-4 rounded-xl items-center"
                  >
                    <Text className="text-primary-foreground font-bold">
                      Update
                    </Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          </View>
        )}

      </ScrollView>

      {/* EDIT CLIENT MODAL (Similar to ClientsManager) */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/40" onPress={closeEditModal}>
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
            <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />

            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-semibold">Edit Client</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <X size={28} color={isDark ? "#AAA" : "#666"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Reuse fields logic or hardcode for now */}
              <View className="mb-4">
                <Text className="text-muted-foreground mb-1 font-medium">Client Name *</Text>
                <TextInput
                  value={editFormData.client_name}
                  onChangeText={(val) => setEditFormData(prev => ({ ...prev, client_name: val }))}
                  className="border border-input rounded-xl p-3"
                />
              </View>

              <View className="mb-4">
                <Text className="text-muted-foreground mb-1 font-medium">Contact Person</Text>
                <TextInput
                  value={editFormData.contact_person_name}
                  onChangeText={(val) => setEditFormData(prev => ({ ...prev, contact_person_name: val }))}
                  className="border border-input rounded-xl p-3"
                />
              </View>

              <View className="mb-4">
                <Text className="text-muted-foreground mb-1 font-medium">Phone *</Text>
                <TextInput
                  value={editFormData.contact_number}
                  onChangeText={(val) => setEditFormData(prev => ({ ...prev, contact_number: val }))}
                  keyboardType="phone-pad"
                  className="border border-input rounded-xl p-3"
                />
              </View>

              <TouchableOpacity
                onPress={handleUpdateClient}
                className="bg-primary p-4 rounded-xl mt-4 mb-3"
              >
                <Text className="text-center text-primary-foreground font-semibold">Update Client</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeEditModal}
                className="border border-border p-4 rounded-xl"
              >
                <Text className="text-center text-muted-foreground">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

function SummaryCard({ label, value, green, red }: any) {
  return (
    <View className="flex-1 bg-card rounded-2xl p-3 justify-between min-h-[90px]">
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={`text-lg font-bold mt-2 ${green
          ? "text-green-600"
          : red
            ? "text-red-600"
            : "text-card-foreground"
          }`}
      >
        ₹ {Number(value).toLocaleString()}
      </Text>
    </View>
  );
}
