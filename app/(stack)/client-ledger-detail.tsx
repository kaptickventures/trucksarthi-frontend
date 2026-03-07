import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, Banknote, Building2, Edit, Eye, FileText, MapPin, Plus, Share2, Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "../../components/BottomSheet";

import { Skeleton } from "../../components/Skeleton";
import useClients from "../../hooks/useClient";
import { useClientLedger } from "../../hooks/useClientLedger";
import useDrivers from "../../hooks/useDriver";
import { Invoice, useInvoices } from "../../hooks/useInvoice";
import useLocations from "../../hooks/useLocation";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrips, { Trip } from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";
import { useUser } from "../../hooks/useUser";
import { formatDate } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";
import API from "../../app/api/axiosInstance";

export default function ClientLedgerDetailScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { loading: userLoading } = useUser();
  const navigation = useNavigation();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: {
        color: colors.foreground,
        fontWeight: "800",
        fontSize: 22,
      },
      headerTintColor: colors.foreground,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/(stack)/notifications" as any)}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, router]);

  /* ---------------- ROUTE PARAM ---------------- */
  const { clientId } = useLocalSearchParams<{ clientId?: string | string[] }>();

  const id = useMemo(() => {
    if (!clientId) return undefined;
    return Array.isArray(clientId) ? clientId[0] : clientId;
  }, [clientId]);

  const {
    entries,
    fetchLedger,
    addPayment,
    deleteEntry,
  } = useClientLedger();

  /* ---------------- STATE ---------------- */
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"unbilled" | "billed" | "settled">("unbilled");

  // Payment Form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [settlingInvoiceId, setSettlingInvoiceId] = useState<string | null>(null);
  const [showInvoiceConfigForm, setShowInvoiceConfigForm] = useState(false);
  const [invoiceTaxType, setInvoiceTaxType] = useState<"igst" | "cgst_sgst">("igst");
  const [invoiceTaxPercentage, setInvoiceTaxPercentage] = useState<0 | 5 | 18>(0);

  // Edit Client Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
    gstin: "",
    gstin_details: undefined as any,
  });
  const translateY = useRef(new Animated.Value(0)).current;
  const SCROLL_THRESHOLD = 40;
  const PAYMENT_MODES = ["CASH", "BANK", "UPI"] as const;
  const TAX_TYPES = [
    { label: "IGST", value: "igst" },
    { label: "CGST + SGST", value: "cgst_sgst" },
  ] as const;
  const TAX_PERCENTAGES = [0, 5, 18] as const;

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

  const { invoices, fetchInvoices, createInvoice, deleteInvoice } =
    useInvoices();

  const { trips, fetchTrips } = useTrips({ autoFetch: false });


  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!id) return;

    fetchClients();
    fetchInvoices();
    fetchTrips();
    fetchLedger(id);
  }, [id, fetchClients, fetchInvoices, fetchTrips, fetchLedger]);

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
  const generateInvoicePDF = async (invoice: Invoice, mode: "share" | "view" = "share") => {
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

      const invoiceSubtotal = Number(invoice.subtotal_amount ?? subtotal);
      const taxPercentage = Number(invoice.tax_percentage ?? 0);
      const tax = Number(invoice.tax_amount ?? (invoiceSubtotal * taxPercentage) / 100);
      const grandTotal = Number(invoice.total_amount ?? (invoiceSubtotal + tax));
      const taxTypeLabel =
        invoice.tax_type === "cgst_sgst"
          ? "CGST + SGST"
          : invoice.tax_type === "igst"
            ? "IGST"
            : "No Tax";

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
      margin-bottom: 24px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
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
      <span>₹${invoiceSubtotal.toLocaleString()}</span>
    </div>
    <div>
      <span>Tax (${taxPercentage}%${taxPercentage > 0 ? ` - ${taxTypeLabel}` : ""})</span>
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
      const filename = `Invoice-${invoice.invoice_number || "N-A"}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.moveAsync({ from: uri, to: fileUri });

      if (mode === "share") {
        await Sharing.shareAsync(fileUri);
      } else {
        router.push({
          pathname: "/(stack)/pdf-viewer",
          params: { uri: fileUri, title: `Invoice #${invoice.invoice_number}` }
        } as any);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", `Failed to ${mode} invoice PDF`);
    }
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    generateInvoicePDF(invoice, "view");
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
      .filter((i) => {
        if (!i) return false;
        const status = String(i.status || "").toLowerCase();
        return status === "pending" || status === "partially_paid";
      })
      .reduce((sum, invoice) => {
        const invoiceId = getId(invoice);
        const totalPaidForInvoice = (entries || [])
          .filter((entry) => {
            if (!entry || entry.entry_type !== "credit") return false;
            const entryInvoiceId = getId((entry as any).invoice || (entry as any).invoice_id);
            return entryInvoiceId === invoiceId;
          })
          .reduce((paid, entry) => paid + Number(entry?.amount || 0), 0);

        const remaining = Math.max(0, Number(invoice?.total_amount || 0) - totalPaidForInvoice);
        return sum + remaining;
      }, 0);
  }, [clientInvoices, entries]);

  const settledAmount = useMemo(() => {
    return (entries || [])
      .filter((e) => e && e.entry_type === "credit")
      .reduce((sum, e) => sum + Number(e?.amount || 0), 0);
  }, [entries]);

  const paymentCountsByInvoice = useMemo(() => {
    const counts: Record<string, number> = {};
    (entries || []).forEach(e => {
      if (e && e.entry_type === 'credit') {
        const invId = getId((e as any).invoice || (e as any).invoice_id);
        if (invId) {
          counts[invId] = (counts[invId] || 0) + 1;
        }
      }
    });
    return counts;
  }, [entries]);

  /* ---------------- ACTIONS ---------------- */
  // Update Payment Date helper
  const onPaymentDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPaymentDate(selectedDate);
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
      tax_type: invoiceTaxPercentage === 0 ? "none" : invoiceTaxType,
      tax_percentage: invoiceTaxPercentage,
    });

    setSelectedTrips([]);
    setShowInvoiceConfigForm(false);
    fetchInvoices();
    fetchTrips();
    fetchLedger(id);
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || !id) {
      Alert.alert(t('enterAmount'));
      return;
    }
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(t('enterValidAmount'));
      return;
    }
    if (!paymentRemarks.trim()) {
      Alert.alert(t('remarksMandatory'));
      return;
    }

    if (settlingInvoiceId) {
      const targetInvoice = clientInvoices.find((inv) => getId(inv) === settlingInvoiceId);
      if (targetInvoice) {
        const totalPaidForInvoice = (entries || [])
          .filter((entry) => {
            if (!entry || entry.entry_type !== "credit") return false;
            const entryInvoiceId = getId((entry as any).invoice || (entry as any).invoice_id);
            return entryInvoiceId === settlingInvoiceId;
          })
          .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);

        const remainingAmount = Math.max(0, Number(targetInvoice.total_amount || 0) - totalPaidForInvoice);
        if (amount > remainingAmount) {
          Alert.alert(
            t('amountExceedsRemaining'),
            `Remaining for this invoice is ₹${remainingAmount.toLocaleString()}. Please enter a smaller amount.`
          );
          return;
        }
      }
    }

    await addPayment({
      client_id: id,
      invoice_id: settlingInvoiceId || undefined,
      amount,
      remarks: paymentRemarks,
      paymentMode,
      date: paymentDate.toISOString(),
    });

    setSettlingInvoiceId(null);

    setPaymentAmount("");
    setPaymentRemarks("");
    setPaymentMode("CASH");
    setPaymentDate(new Date());
    setShowPaymentForm(false);

    fetchLedger(id);
    fetchInvoices();
    fetchTrips();
  };

  const handleSettleInvoice = async (invoice: Invoice) => {
    const invoiceId = getId(invoice);
    const totalPaidForInvoice = (entries || [])
      .filter((entry) => {
        if (!entry || entry.entry_type !== "credit") return false;
        const entryInvoiceId = getId((entry as any).invoice || (entry as any).invoice_id);
        return entryInvoiceId === invoiceId;
      })
      .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);

    const invoiceTotal = Number(invoice.total_amount || 0);
    const remainingAmount = Math.max(0, invoiceTotal - totalPaidForInvoice);

    // Open payment modal pre-filled
    setSettlingInvoiceId(invoice._id);
    setPaymentAmount(remainingAmount.toString());
    setPaymentRemarks(`Settlement for Invoice #${invoice.invoice_number || "-"}`);
    setPaymentMode("BANK");
    setPaymentDate(new Date());
    setShowPaymentForm(true);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    Alert.alert("Delete Invoice", "Delete this invoice? Its trips will move back to Unbilled.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          try {
            await deleteInvoice(invoiceId);
            await Promise.all([fetchInvoices(), fetchTrips(), fetchLedger(id)]);
          } catch { }
        },
      },
    ]);
  };

  const handleDeletePaymentEntry = (entryId: string) => {
    Alert.alert("Delete Payment", "Delete this payment transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          try {
            await deleteEntry(entryId, id);
            await Promise.all([fetchInvoices(), fetchTrips(), fetchLedger(id)]);
          } catch { }
        },
      },
    ]);
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
        gstin: client.gstin || "",
        gstin_details: client.gstin_details || undefined,
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

  const [verifyingGstin, setVerifyingGstin] = useState(false);

  const verifyGSTIN = async () => {
    if (!editFormData.gstin) return;
    setVerifyingGstin(true);
    try {
      const res = await API.post("/api/kyc/gstin", { gstin: editFormData.gstin });
      if (res.data?.verified && res.data?.data) {
        const details = res.data.data;
        setEditFormData((prev: any) => ({
          ...prev,
          client_name: details.trade_name_of_business || details.legal_name_of_business || prev.client_name,
          office_address: details.principal_place_address || prev.office_address,
          gstin_details: details
        }));
        Alert.alert("Success", "GSTIN details fetched and applied!");
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to verify GSTIN");
    } finally {
      setVerifyingGstin(false);
    }
  };

  const handleUpdateClient = async () => {
    const requiredFields = [
      "client_name",
      "contact_number",
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

  // Still loading or clients array not yet populated — show skeleton
  if (userLoading || clientsLoading || !id || (clients.length > 0 && !client)) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
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
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('clientKhata')}</Text>
              <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('billingSummary')}</Text>
            </View>
          </View>
        </View>
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
                {client.contact_person_name || "—"} {client.gstin ? ` • ${client.gstin}` : ""}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={openEditModal}
                style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}
              >
                <Edit size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => client.email_address && Linking.openURL(`mailto:${client.email_address}`)}
                style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}
              >
                <Ionicons name="mail-outline" size={15} color={colors.primary} />
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
              <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>📞 {t('call')}</Text>
            </TouchableOpacity>

            {/* WHATSAPP */}
            <TouchableOpacity
              onPress={() =>
                client.contact_number &&
                Linking.openURL(
                  `https://wa.me/91${client.contact_number}?text=Hello ${client.client_name}`
                )
              }
              style={{ flex: 1, backgroundColor: '#25D366', paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="logo-whatsapp" size={18} color="white" />
                <Text style={{ fontWeight: '600', fontSize: 14, color: 'white' }}>
                  WhatsApp
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <SummaryCard label={t('unbilled')} value={unbilledAmount} />
          <SummaryCard label={t('billed')} value={billedAmount} />
          <SummaryCard label={t('settled')} value={settledAmount} green />
        </View>

        {/* Tabs */}
        <View className="flex-row mb-6 p-1 rounded-2xl" style={{ backgroundColor: colors.muted + '4D' }}>
          {(["unbilled", "billed", "settled"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: activeTab === tab ? colors.card : 'transparent',
                shadowColor: activeTab === tab ? "#000" : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: activeTab === tab ? 0.1 : 0,
                shadowRadius: 4,
                elevation: activeTab === tab ? 2 : 0,
              }}
            >
              <Text
                className="font-bold text-sm capitalize"
                style={{ color: activeTab === tab ? colors.primary : colors.mutedForeground }}
              >
                {t(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "unbilled" && (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.foreground }}>{t('pendingTrips')}</Text>
              {selectedTrips.length > 0 && (
                <TouchableOpacity onPress={() => setShowInvoiceConfigForm(true)} className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.primary }}>
                  <Text style={{ color: colors.primaryForeground, fontWeight: 'bold' }} className="text-xs">{t('generateInvoice')} ({selectedTrips.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {clientTrips.filter(t => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced").map(trip => (
              <TouchableOpacity
                key={getId(trip)}
                onPress={() => toggleTripSelection(getId(trip))}
                className="p-4 rounded-2xl mb-3 border"
                style={{
                  backgroundColor: colors.card,
                  borderColor: selectedTrips.includes(getId(trip)) ? colors.primary : colors.border + '80'
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="font-bold" style={{ color: colors.foreground }}>Trip #{getId(trip).slice(-6)}</Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>{trip.trip_date ? formatDate(trip.trip_date) : "N/A"}</Text>
                  </View>
                  <Text className="font-bold text-lg" style={{ color: colors.foreground }}>₹{(Number(trip.cost_of_trip) + Number(trip.miscellaneous_expense || 0)).toLocaleString()}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <MapPin size={14} color={colors.mutedForeground} />
                  <Text className="text-xs" style={{ color: colors.mutedForeground }} numberOfLines={1}>
                    {locationMap[getId(trip.start_location)]} → {locationMap[getId(trip.end_location)]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === "billed" && (
          <View>
            <Text className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>{t('billed')}</Text>
            {clientInvoices.map(invoice => {
              const invoiceId = getId(invoice);
              const totalPaidForInvoice = (entries || [])
                .filter((entry) => {
                  if (!entry || entry.entry_type !== "credit") return false;
                  const entryInvoiceId = getId((entry as any).invoice || (entry as any).invoice_id);
                  return entryInvoiceId === invoiceId;
                })
                .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);

              const totalAmount = Number(invoice.total_amount || 0);
              const remainingAmount = Math.max(0, totalAmount - totalPaidForInvoice);
              const isPartiallyPaid = String(invoice.status || "").toLowerCase() === "partially_paid";

              return (
                <View key={invoiceId} className="p-4 rounded-2xl mb-3 border" style={{ backgroundColor: colors.card, borderColor: colors.border + '80' }}>
                  <View className="flex-row justify-between items-center mb-3">
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text className="font-bold" style={{ color: colors.foreground }} numberOfLines={1} ellipsizeMode="tail">
                        Invoice #{invoice.invoice_number}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.mutedForeground }} numberOfLines={1} ellipsizeMode="tail">
                        Due: {invoice.due_date ? formatDate(invoice.due_date) : "N/A"}
                      </Text>
                    </View>
                    <View className="px-2 py-1 rounded-md" style={{ backgroundColor: invoice.status === 'paid' ? '#22c55e20' : '#ef444420' }}>
                      <Text className="font-bold text-[10px] uppercase" style={{ color: invoice.status === 'paid' ? '#22c55e' : '#ef4444' }}>{invoice.status}</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center pt-3 border-t" style={{ borderTopColor: colors.border + '4D' }}>
                    <View>
                      <Text className="font-bold text-lg" style={{ color: colors.foreground }}>
                        ₹{remainingAmount.toLocaleString()}
                      </Text>
                      {remainingAmount < totalAmount && (
                        <Text className="text-[11px]" style={{ color: colors.mutedForeground }}>
                          Balance due (Total: ₹{totalAmount.toLocaleString()})
                        </Text>
                      )}
                      {remainingAmount === totalAmount && (
                        <Text className="text-[11px]" style={{ color: colors.mutedForeground }}>
                          Full balance pending
                        </Text>
                      )}
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => generateInvoicePDF(invoice, "view")} className="p-2 rounded-lg" style={{ backgroundColor: colors.muted }}>
                        <Eye size={16} color={colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => generateInvoicePDF(invoice, "share")} className="p-2 rounded-lg" style={{ backgroundColor: colors.muted }}>
                        <Share2 size={16} color={colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteInvoice(getId(invoice))} className="p-2 rounded-lg" style={{ backgroundColor: colors.muted }}>
                        <Trash2 size={16} color={colors.destructive} />
                      </TouchableOpacity>
                      {invoice.status !== 'paid' && (
                        <TouchableOpacity onPress={() => handleSettleInvoice(invoice)} className="px-4 py-2 rounded-full" style={{ backgroundColor: colors.primary }}>
                          <Text style={{ color: colors.primaryForeground, fontWeight: 'bold' }} className="text-xs">Settle</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {activeTab === "settled" && (
          <View>
            <Text className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>{t('paymentHistory')}</Text>
            {entries.filter(e => e.entry_type === 'credit').map(entry => (
              <View key={getId(entry)} className="p-4 rounded-2xl mb-3 border flex-row items-start" style={{ backgroundColor: colors.card, borderColor: colors.border + '80' }}>
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#22c55e20' }}>
                  <ArrowDownLeft size={20} color="#16a34a" />
                </View>
                <View className="flex-1" style={{ paddingRight: 10 }}>
                  <Text className="font-bold" style={{ color: colors.foreground, flexShrink: 1 }}>
                    {entry.remarks || "Payment Received"}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.mutedForeground }} numberOfLines={1} ellipsizeMode="tail">
                    {formatDate(entry.entry_date)} | {entry.payment_mode || "CASH"}
                  </Text>
                </View>
                <View className="items-end" style={{ minWidth: 86, marginLeft: 6 }}>
                  <View className="px-2 py-1 rounded-md mb-1" style={{ backgroundColor: (entry.payment_type === "PARTIAL" || paymentCountsByInvoice[getId((entry as any).invoice || (entry as any).invoice_id)] > 1) ? "#f59e0b20" : "#22c55e20" }}>
                    <Text className="text-[10px] font-bold" style={{ color: (entry.payment_type === "PARTIAL" || paymentCountsByInvoice[getId((entry as any).invoice || (entry as any).invoice_id)] > 1) ? "#d97706" : "#22c55e" }}>
                      {(entry.payment_type === "PARTIAL" || paymentCountsByInvoice[getId((entry as any).invoice || (entry as any).invoice_id)] > 1) ? "PARTIAL" : "FULL"}
                    </Text>
                  </View>
                  <Text className="font-bold" style={{ color: "#16a34a" }}>₹{Number(entry.amount).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => handleDeletePaymentEntry(getId(entry))} style={{ padding: 4, marginTop: 4 }}>
                    <Trash2 size={14} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}



        <BottomSheet
          visible={showInvoiceConfigForm}
          onClose={() => setShowInvoiceConfigForm(false)}
          title="Generate Invoice"
          subtitle={`${selectedTrips.length} trip(s) selected`}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="mb-6">
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Tax Percentage</Text>
              <View className="flex-row gap-2">
                {TAX_PERCENTAGES.map((percent) => {
                  const selected = invoiceTaxPercentage === percent;
                  return (
                    <TouchableOpacity
                      key={`tax-percent-${percent}`}
                      onPress={() => setInvoiceTaxPercentage(percent)}
                      className="px-4 py-2 rounded-full"
                      style={{
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border + "40",
                        backgroundColor: selected ? colors.primary : (isDark ? colors.card : colors.secondary + "40"),
                      }}
                    >
                      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontWeight: "800" }}>
                        {percent}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Tax Type</Text>
              <View
                className="flex-row gap-2"
                style={{ opacity: invoiceTaxPercentage === 0 ? 0.6 : 1 }}
              >
                {TAX_TYPES.map((taxType) => {
                  const selected = invoiceTaxType === taxType.value;
                  const disabled = invoiceTaxPercentage === 0;
                  return (
                    <TouchableOpacity
                      key={`tax-type-${taxType.value}`}
                      onPress={() => !disabled && setInvoiceTaxType(taxType.value)}
                      disabled={disabled}
                      className="px-4 py-2 rounded-full"
                      style={{
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border + "40",
                        backgroundColor: disabled
                          ? colors.muted
                          : selected
                            ? colors.primary
                            : (isDark ? colors.card : colors.secondary + "40"),
                      }}
                    >
                      <Text style={{ color: selected && !disabled ? colors.primaryForeground : colors.foreground, fontWeight: "800" }}>
                        {taxType.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {invoiceTaxPercentage === 0 && (
                <Text className="text-xs mt-2 ml-1" style={{ color: colors.mutedForeground }}>
                  Not required for 0%
                </Text>
              )}
            </View>

            <View className="mb-6 rounded-2xl p-4" style={{ borderWidth: 1, borderColor: colors.border + '30', backgroundColor: isDark ? colors.card : colors.secondary + '30' }}>
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: colors.mutedForeground }}>Payment Options</Text>
              <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>Reserved space for invoice payment options.</Text>
              <View className="flex-row gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <View
                    key={`invoice-payment-${mode}`}
                    className="px-3 py-2 rounded-xl"
                    style={{ borderWidth: 1, borderColor: colors.border + '40', backgroundColor: colors.muted }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.mutedForeground }}>{mode}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleGenerateInvoice}
              style={{ backgroundColor: colors.primary }}
              className="py-4 rounded-[18px]"
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 16 }} className="text-center">
                CREATE INVOICE
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </BottomSheet>

        <BottomSheet
          visible={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          title="Add Payment"
          subtitle={client?.client_name || "Client"}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* DATE PICKER */}
            <View className="mb-6">
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center rounded-2xl px-4 py-4"
                style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', borderWidth: 1, borderColor: colors.border + '30' }}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <Text className="text-base font-bold" style={{ color: colors.foreground }}>{formatDate(paymentDate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker value={paymentDate} mode="date" display="default" onChange={onPaymentDateChange} />
              )}
            </View>

            {/* AMOUNT */}
            <View className="mb-6">
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Amount</Text>
              <View className="flex-row items-center rounded-2xl px-5 py-4" style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', borderWidth: 1, borderColor: colors.border + '30' }}>
                <Banknote size={24} color="#16a34a" />
                <TextInput
                  placeholder="0"
                  keyboardType="numeric"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  className="flex-1 ml-3 text-2xl font-black"
                  style={{ color: colors.foreground, padding: 0 }}
                  placeholderTextColor={colors.mutedForeground + '60'}
                />
              </View>
            </View>

            {/* REMARKS */}
            <View className="mb-6">
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Remarks *</Text>
              <TextInput
                placeholder="Payment details / Settlement notes"
                value={paymentRemarks}
                onChangeText={setPaymentRemarks}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="text-base font-bold rounded-2xl p-4"
                style={{
                  backgroundColor: isDark ? colors.card : colors.secondary + '40',
                  borderWidth: 1,
                  borderColor: colors.border + '30',
                  color: colors.foreground,
                  minHeight: 100
                }}
                placeholderTextColor={colors.mutedForeground + '60'}
              />
            </View>

            <View className="mb-8">
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Payment Mode</Text>
              <View className="flex-row gap-2">
                {PAYMENT_MODES.map((mode) => {
                  const selected = paymentMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setPaymentMode(mode)}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 20,
                        borderWidth: 1,
                        alignItems: "center",
                        backgroundColor: selected ? colors.primary : (isDark ? colors.card : colors.secondary + '40'),
                        borderColor: selected ? colors.primary : colors.border + '30',
                      }}
                    >
                      <Text style={{ color: selected ? "white" : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>{mode}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleAddPayment}
                style={{ backgroundColor: colors.primary }}
                className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
              >
                <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }} className="text-center font-black">SAVE PAYMENT</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </BottomSheet>

        <BottomSheet
          visible={showEditModal}
          onClose={closeEditModal}
          title={t('editClient')}
          subtitle="Update business profile"
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="gap-5">
              <View>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>{t('clientName')} *</Text>
                <TextInput
                  className="p-4 rounded-2xl font-bold"
                  style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                  value={editFormData.client_name}
                  onChangeText={(t) => setEditFormData(prev => ({ ...prev, client_name: t }))}
                  placeholder="e.g. Acme Corp"
                  placeholderTextColor={colors.mutedForeground + '60'}
                />
              </View>
              <View>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>{t('contactPerson')} *</Text>
                <TextInput
                  className="p-4 rounded-2xl font-bold"
                  style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                  value={editFormData.contact_person_name}
                  onChangeText={(t) => setEditFormData(prev => ({ ...prev, contact_person_name: t }))}
                  placeholder="Full Name"
                  placeholderTextColor={colors.mutedForeground + '60'}
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>{t('clientContact')} *</Text>
                  <TextInput
                    className="p-4 rounded-2xl font-bold"
                    style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                    value={editFormData.contact_number}
                    onChangeText={(t) => setEditFormData(prev => ({ ...prev, contact_number: t }))}
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.mutedForeground + '60'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>{t('email')} *</Text>
                  <TextInput
                    className="p-4 rounded-2xl font-bold"
                    style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                    value={editFormData.email_address}
                    onChangeText={(t) => setEditFormData(prev => ({ ...prev, email_address: t }))}
                    keyboardType="email-address"
                    placeholderTextColor={colors.mutedForeground + '60'}
                  />
                </View>
              </View>

              <View>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>GSTIN Number</Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <TextInput
                      className="p-4 rounded-2xl font-bold"
                      style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                      value={editFormData.gstin}
                      onChangeText={(t) => setEditFormData(prev => ({ ...prev, gstin: t }))}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      placeholderTextColor={colors.mutedForeground + '60'}
                      autoCapitalize="characters"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={verifyGSTIN}
                    disabled={verifyingGstin || !editFormData.gstin}
                    style={{ backgroundColor: editFormData.gstin ? colors.primary : colors.muted }}
                    className="w-20 rounded-2xl items-center justify-center border border-border/50"
                  >
                    <Text style={{ color: editFormData.gstin ? "white" : colors.mutedForeground }} className="font-bold text-[10px] uppercase tracking-widest text-center px-1">
                      {verifyingGstin ? "Verifying..." : "Verify\n& Fill"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>{t('officeAddress')} *</Text>
                <TextInput
                  className="p-4 rounded-2xl font-bold"
                  style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                  value={editFormData.office_address}
                  onChangeText={(t) => setEditFormData(prev => ({ ...prev, office_address: t }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor={colors.mutedForeground + '60'}
                  placeholder="Address..."
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <TouchableOpacity
                  onPress={handleUpdateClient}
                  className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }} className="text-center font-black">{t('saveUpdates').toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </BottomSheet>

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
