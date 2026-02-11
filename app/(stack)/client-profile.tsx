import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, Banknote, Building2, Edit, FileText, MapPin, Plus, Share2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Skeleton } from "../../components/Skeleton";
import useClients from "../../hooks/useClient";
import { ClientLedger, useClientLedger } from "../../hooks/useClientLedger";
import useDrivers from "../../hooks/useDriver";
import { Invoice, useInvoices } from "../../hooks/useInvoice";
import useLocations from "../../hooks/useLocation";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrips, { Trip } from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";
import { useUser } from "../../hooks/useUser";
import { formatDate } from "../../lib/utils";

export default function ClientProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
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
  const [refreshing, setRefreshing] = useState(false);
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
  const [settlingInvoiceId, setSettlingInvoiceId] = useState<string | null>(null);

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


  const getId = (obj: any): string => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (typeof obj === "object" && obj._id) return obj._id;
    return String(obj);
  };

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
    fetchLedger(id);
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchClients(),
        fetchInvoices(),
        fetchTrips(),
        id ? fetchLedger(id) : Promise.resolve(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [id, fetchClients, fetchInvoices, fetchTrips, fetchLedger]);

  /* ---------------- HELPERS ---------------- */
  const normalizeInvoiceStatus = (status: any) => {
    if (!status) return "not_invoiced";
    return status.toString().toLowerCase().replace(" ", "_");
  };

  const driverMap = useMemo(() => {
    const map: Record<string, string> = {};
    (drivers || []).forEach((d) => {
      if (d && d._id) map[d._id] = d.name || d.driver_name || "Driver";
    });
    return map;
  }, [drivers]);

  const truckMap = useMemo(() => {
    const map: Record<string, string> = {};
    (trucks || []).forEach((t) => {
      if (t && t._id) map[t._id] = t.registration_number;
    });
    return map;
  }, [trucks]);

  const locationMap = useMemo(() => {
    const map: Record<string, string> = {};
    (locations || []).forEach((l) => {
      if (l && l._id) map[l._id] = l.location_name;
    });
    return map;
  }, [locations]);


  // ✅ ADD — Invoice PDF (same approach as TripLog)
  const generateInvoicePDF = async (invoice: Invoice) => {
    try {
      const invoiceTrips = invoice.items.map(item => {
        const tripDetail = trips.find(t => getId(t) === getId(item.trip));
        if (!tripDetail) return null;
        return {
          ...tripDetail,
          cost_of_trip: item.trip_cost,
          miscellaneous_expense: item.misc_expense,
          _id: getId(item.trip)
        } as Trip;
      }).filter((t): t is Trip => t !== null);

      const subtotal = invoiceTrips.reduce(
        (acc, t) =>
          acc + Number(t.cost_of_trip) + Number(t.miscellaneous_expense || 0),
        0
      );

      const taxRate = 0.05;
      const tax = subtotal * taxRate;
      const grandTotal = subtotal + tax;

      const today = formatDate(new Date());


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
    <h1>Trucksarthi</h1>
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
    ${client?.office_address || "Logistics & Transportation Services"}
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
          <td>${t.trip_date ? formatDate(t.trip_date) : "—"}</td>
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
    <p>Trucksarthi – Your Trusted Logistics Partner</p>
    <p>Generated on ${formatDate(new Date())}</p>
  </div>

</body>
</html>
`;

      const { uri } = await Print.printToFileAsync({ html });
      // @ts-ignore
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

  const clientInvoices = (invoices || []).filter(
    (i: Invoice) => i && getId(i.client) === id
  );

  const clientTrips = (trips || []).filter(
    (t: Trip) => t && getId(t.client) === id
  );

  // 💰 CALCULATED AMOUNTS
  const unbilledAmount = useMemo(() => {
    return clientTrips
      .filter((t) => t && normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced")
      .reduce((sum, t) => sum + Number(t?.cost_of_trip || 0) + Number(t?.miscellaneous_expense || 0), 0);
  }, [clientTrips]);

  const billedAmount = useMemo(() => {
    return clientInvoices
      .filter((i) => i && i.status === "pending")
      .reduce((sum, i) => sum + Number(i?.total_amount || 0), 0);
  }, [clientInvoices]);

  const settledAmount = useMemo(() => {
    return (entries || [])
      .filter((e) => e && e.entry_type === "credit")
      .reduce((sum, e) => sum + Number(e?.amount || 0), 0);
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
      invoice_id: settlingInvoiceId || undefined,
      amount: Number(paymentAmount),
      remarks: paymentRemarks,
      date: paymentDate.toISOString(),
    });

    setSettlingInvoiceId(null);

    setPaymentAmount("");
    setPaymentRemarks("");
    setPaymentDate(new Date());
    setShowPaymentForm(false);

    fetchLedger(id);
    fetchInvoices();
    fetchTrips();
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
    setSettlingInvoiceId(invoice._id);
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
    const requiredFields = [
      "client_name",
      "contact_number",
      "contact_person_name",
      "alternate_contact_number",
      "email_address",
      "office_address"
    ];

    const missingFields = requiredFields.filter(f => !editFormData[f as keyof typeof editFormData]);

    if (missingFields.length > 0) {
      const labels = missingFields.map(f => f.replaceAll("_", " ").toUpperCase());
      Alert.alert("⚠️ Missing Fields", `Please fill the following required fields:\n\n• ${labels.join("\n• ")}`);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={120} height={24} />
          <View style={{ width: 24 }} />
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          {/* Client Card Skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Skeleton width={56} height={56} borderRadius={28} style={{ marginRight: 16 }} />
              <View style={{ gap: 8 }}>
                <Skeleton width={150} height={20} />
                <Skeleton width={100} height={14} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
              <Skeleton style={{ flex: 1, height: 40, borderRadius: 12 }} />
              <Skeleton style={{ flex: 1, height: 40, borderRadius: 12 }} />
            </View>
          </View>

          {/* Summary Row Skeleton */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            <Skeleton style={{ flex: 1, height: 80, borderRadius: 16 }} />
            <Skeleton style={{ flex: 1, height: 80, borderRadius: 16 }} />
            <Skeleton style={{ flex: 1, height: 80, borderRadius: 16 }} />
          </View>

          {/* Tabs Skeleton */}
          <View style={{ flexDirection: 'row', marginBottom: 24, gap: 8 }}>
            <Skeleton style={{ flex: 1, height: 40, borderRadius: 12 }} />
            <Skeleton style={{ flex: 1, height: 40, borderRadius: 12 }} />
            <Skeleton style={{ flex: 1, height: 40, borderRadius: 12 }} />
          </View>

          {/* List Skeleton */}
          {[1, 2, 3].map(i => (
            <Skeleton key={i} width="100%" height={100} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Client not found</Text>
      </View>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Client Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Client Card */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, backgroundColor: colors.secondary, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <Building2 size={26} color="#16a34a" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                {client.client_name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                {client.contact_person_name || "—"}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => client.contact_number && Linking.openURL(`tel:${client.contact_number}`)}
                style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}
              >
                <Ionicons name="call-outline" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => client.email_address && Linking.openURL(`mailto:${client.email_address}`)}
                style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}
              >
                <Ionicons name="mail-outline" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openEditModal} style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}>
                <Edit size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ACTION ROW */}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
            {/* CALL */}
            <TouchableOpacity
              onPress={() =>
                client.contact_number &&
                Linking.openURL(`tel:${client.contact_number}`)
              }
              style={{ flex: 1, backgroundColor: colors.muted, paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>📞 Call</Text>
            </TouchableOpacity>

            {/* WHATSAPP */}
            <TouchableOpacity
              onPress={() =>
                client.contact_number &&
                Linking.openURL(
                  `https://wa.me/91${client.contact_number}?text=Hello ${client.client_name}`
                )
              }
              style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '600', fontSize: 14, color: 'white' }}>
                💬 WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <SummaryCard label="Billed" value={billedAmount} />
          <SummaryCard label="Unbilled" value={unbilledAmount} />
          <SummaryCard label="Settled" value={settledAmount} green />
        </View>

        {/* Tabs */}
        <View className="flex-row mb-6 bg-muted/30 p-1 rounded-2xl">
          {(["unbilled", "billed", "settled"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 items-center rounded-xl ${activeTab === tab ? "bg-background" : ""}`}
              style={activeTab === tab ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              } : {}}
            >
              <Text className={`capitalize font-bold text-xs ${activeTab === tab ? "text-foreground" : "text-muted-foreground"}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "unbilled" && (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">Pending Trips</Text>
              {selectedTrips.length > 0 && (
                <TouchableOpacity onPress={handleGenerateInvoice} className="bg-primary px-4 py-2 rounded-lg">
                  <Text className="text-white font-bold text-xs">Generate Invoice ({selectedTrips.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {clientTrips.filter(t => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced").map(trip => (
              <TouchableOpacity
                key={getId(trip)}
                onPress={() => toggleTripSelection(getId(trip))}
                className={`bg-card p-4 rounded-2xl mb-3 border ${selectedTrips.includes(getId(trip)) ? "border-primary" : "border-border/50"}`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="text-foreground font-bold">Trip #{getId(trip).slice(-6)}</Text>
                    <Text className="text-muted-foreground text-xs">{trip.trip_date ? formatDate(trip.trip_date) : "N/A"}</Text>
                  </View>
                  <Text className="text-foreground font-bold text-lg">₹{(Number(trip.cost_of_trip) + Number(trip.miscellaneous_expense || 0)).toLocaleString()}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <MapPin size={14} color={colors.mutedForeground} />
                  <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                    {locationMap[getId(trip.start_location)]} → {locationMap[getId(trip.end_location)]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === "billed" && (
          <View>
            <Text className="text-lg font-bold text-foreground mb-4">Invoices</Text>
            {clientInvoices.map(invoice => (
              <View key={getId(invoice)} className="bg-card p-4 rounded-2xl mb-3 border border-border/50">
                <View className="flex-row justify-between items-center mb-3">
                  <View>
                    <Text className="text-foreground font-bold">Invoice #{invoice.invoice_number}</Text>
                    <Text className="text-muted-foreground text-xs">Due: {invoice.due_date ? formatDate(invoice.due_date) : "N/A"}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-md ${invoice.status === 'paid' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <Text className={`font-bold text-[10px] uppercase ${invoice.status === 'paid' ? 'text-success' : 'text-destructive'}`}>{invoice.status}</Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center pt-3 border-t border-border/30">
                  <Text className="text-foreground font-bold text-lg">₹{Number(invoice.total_amount).toLocaleString()}</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => generateInvoicePDF(invoice)} className="p-2 bg-muted rounded-lg">
                      <Share2 size={16} color={colors.foreground} />
                    </TouchableOpacity>
                    {invoice.status !== 'paid' && (
                      <TouchableOpacity onPress={() => handleSettleInvoice(invoice)} className="bg-primary px-4 py-2 rounded-lg">
                        <Text className="text-white font-bold text-xs">Settle</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "settled" && (
          <View>
            <Text className="text-lg font-bold text-foreground mb-4">Payment History</Text>
            {entries.filter(e => e.entry_type === 'credit').map(entry => (
              <View key={getId(entry)} className="bg-card p-4 rounded-2xl mb-3 border border-border/50 flex-row items-center">
                <View className="w-10 h-10 bg-success/10 rounded-full items-center justify-center mr-3">
                  <ArrowDownLeft size={20} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold">{entry.remarks || "Payment Received"}</Text>
                  <Text className="text-muted-foreground text-xs">{formatDate(entry.entry_date)}</Text>
                </View>
                <Text className="text-success font-bold">₹{Number(entry.amount).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Add Payment Button - Full Width Bar */}
        <TouchableOpacity
          onPress={() => setShowPaymentForm(true)}
          style={{ backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}
        >
          <Plus size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Add Payment Entry</Text>
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
            className="flex-1"
          >
            <Pressable
              className="flex-1 bg-black/40 justify-end"
              onPress={() => setShowPaymentForm(false)}
            >
              <Pressable
                className="bg-background rounded-t-3xl px-6 pt-4 pb-10"
                onPress={(e) => e.stopPropagation()}
              >
                <View className="items-center mb-6">
                  <View className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                </View>

                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-xl font-bold text-foreground">Add Payment</Text>
                    <Text className="text-sm text-muted-foreground mt-0.5">
                      {client?.client_name || "Client"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowPaymentForm(false)}
                    className="w-9 h-9 rounded-full bg-muted items-center justify-center"
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={colors.foreground}
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
                    <Text className="text-base font-medium text-foreground">
                      {formatDate(paymentDate)}

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
                      style={{ color: colors.foreground }}
                      placeholderTextColor={colors.mutedForeground}
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
                    <FileText size={20} color={colors.mutedForeground} />
                    <TextInput
                      placeholder="Payment details (e.g., Bank Transfer)"
                      value={paymentRemarks}
                      onChangeText={setPaymentRemarks}
                      className="flex-1 ml-3 text-base"
                      style={{ color: colors.foreground }}
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleAddPayment}
                  className="bg-primary py-4 rounded-2xl items-center"
                >
                  <Text className="text-white font-bold text-lg">Save Payment</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Client Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={closeEditModal}
        >
          <View className="flex-1 bg-black/40 justify-end">
            <Animated.View
              {...panResponder.panHandlers}
              className="bg-background rounded-t-3xl px-6 pt-4 pb-12"
              style={{ transform: [{ translateY }] }}
            >
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
              </View>

              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-foreground">Edit Client</Text>
                <TouchableOpacity onPress={closeEditModal} className="w-9 h-9 rounded-full bg-muted items-center justify-center">
                  <X size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-[70%]">
                <View className="gap-4">
                  <View>
                    <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Client Name *</Text>
                    <TextInput
                      className="bg-muted p-4 rounded-xl text-foreground"
                      value={editFormData.client_name}
                      onChangeText={(t) => setEditFormData(prev => ({ ...prev, client_name: t }))}
                      placeholder="e.g. Acme Corp"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Contact Person *</Text>
                    <TextInput
                      className="bg-muted p-4 rounded-xl text-foreground"
                      value={editFormData.contact_person_name}
                      onChangeText={(t) => setEditFormData(prev => ({ ...prev, contact_person_name: t }))}
                      placeholder="Full Name"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Client Contact *</Text>
                      <TextInput
                        className="bg-muted p-4 rounded-xl text-foreground"
                        value={editFormData.contact_number}
                        onChangeText={(t) => setEditFormData(prev => ({ ...prev, contact_number: t }))}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Email *</Text>
                      <TextInput
                        className="bg-muted p-4 rounded-xl text-foreground"
                        value={editFormData.email_address}
                        onChangeText={(t) => setEditFormData(prev => ({ ...prev, email_address: t }))}
                        keyboardType="email-address"
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Office Address *</Text>
                    <TextInput
                      className="bg-muted p-4 rounded-xl text-foreground"
                      value={editFormData.office_address}
                      onChangeText={(t) => setEditFormData(prev => ({ ...prev, office_address: t }))}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleUpdateClient}
                className="bg-primary py-4 rounded-2xl items-center mt-6"
              >
                <Text className="text-white font-bold text-lg">Save Updates</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, green }: any) {
  const { colors } = useThemeStore();
  return (
    <View style={{ backgroundColor: colors.card }} className="flex-1 p-4 rounded-2xl border border-border/50">
      <Text className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{label}</Text>
      <Text style={{ color: green ? colors.success : colors.foreground }} className="text-lg font-bold">₹{Number(value).toLocaleString()}</Text>
    </View>
  );
}
