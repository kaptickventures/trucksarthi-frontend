import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, Banknote, Building2, Calendar, Edit, FileText, MapPin, Plus, Share2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheet from "../../components/BottomSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { formatDate, formatPhoneNumber } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";
import API from "../../app/api/axiosInstance";

export default function ClientProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { t } = useTranslation();
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
  const [paymentMode, setPaymentMode] = useState("CASH");
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
    gstin: "",
    gstin_details: undefined as any,
  });
  const translateX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
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
    return clients.find((c) => c._id === id);
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
      Alert.alert(t('error'), t('selectUninvoicedTrips'));
      return;
    }

    await createInvoice({
      client_id: id,
      tripIds: selectedTrips,
      due_date: new Date().toISOString().split("T")[0],
      tax_type: "none",
      tax_percentage: 0,
    });

    setSelectedTrips([]);
    fetchInvoices();
    fetchTrips();
    fetchLedger(id);
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || !id) {
      Alert.alert(t('error'), t('enterAmount'));
      return;
    }
    if (!paymentRemarks.trim()) {
      Alert.alert(t('error'), t('remarksMandatory'));
      return;
    }

    await addPayment({
      client_id: id,
      invoice_id: settlingInvoiceId || undefined,
      amount: Number(paymentAmount),
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
    setSettlingInvoiceId(invoice._id);
    setPaymentAmount((invoice.total_amount || 0).toString());
    setPaymentRemarks(`${t('settlementForInvoice')} #${invoice.invoice_number || "—"}`);
    setPaymentMode("BANK");
    setPaymentDate(new Date());
    setShowPaymentForm(true);
  };

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

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const handleUpdateClient = async () => {
    const requiredFields = [
      "client_name",
      "contact_number",
    ];

    const missingFields = requiredFields.filter(f => !editFormData[f as keyof typeof editFormData]);

    if (missingFields.length > 0) {
      const labels = missingFields.map(f => f.replaceAll("_", " ").toUpperCase());
      Alert.alert(`⚠️ ${t('missingFields')}`, `${t('requiredFields')}:\n\n• ${labels.join("\n• ")}`);
      return;
    }

    if (!id) return;

    try {
      await updateClient(id, editFormData);
      Alert.alert(t('success'), t('updatedSuccessfully'));
      closeEditModal();
      fetchClients();
    } catch {
      Alert.alert(t('error'), t('failedToSave'));
    }
  };

  if (userLoading || clientsLoading || !id) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 24 }}>
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
      </View>
    );
  }

  if (!client) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>{t('clientNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('clientProfile')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('viewManageClientDetails')}</Text>
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
                onPress={() => client.email_address && Linking.openURL(`mailto:${client.email_address}`)}
                style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}
              >
                <Ionicons name="mail-outline" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openEditModal} style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}>
                <Edit size={16} color={colors.mutedForeground} />
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
              onPress={() => {
                if (client.contact_number) {
                  const cleaned = client.contact_number.replace(/\D/g, "");
                  const waNumber = cleaned.length === 12 && cleaned.startsWith("91") ? cleaned : `91${cleaned.slice(-10)}`;
                  Linking.openURL(`https://wa.me/${waNumber}?text=Hello ${client.client_name}`);
                }
              }}
              style={{ flex: 1, backgroundColor: '#25D366', paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="logo-whatsapp" size={18} color="white" />
                <Text style={{ fontWeight: '600', fontSize: 14, color: 'white' }}>
                  {t('whatsapp')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SUMMARY CARDS */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <SummaryCard label={t('unbilled')} value={unbilledAmount} />
          </View>
          <View style={{ flex: 1 }}>
            <SummaryCard label={t('billed')} value={billedAmount} />
          </View>
          <View style={{ flex: 1 }}>
            <SummaryCard label={t('settled')} value={settledAmount} green />
          </View>
        </View>

      </ScrollView>

      {/* Edit Client Modal */}
      <BottomSheet
        visible={showEditModal}
        onClose={closeEditModal}
        title={t('editClient')}
        subtitle={t('updateClientInformation')}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('clientName')} *</Text>
              <TextInput
                style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                value={editFormData.client_name}
                onChangeText={(t) => setEditFormData(prev => ({ ...prev, client_name: t }))}
                placeholder="e.g. Acme Corp"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('contactPerson')}</Text>
              <TextInput
                style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                value={editFormData.contact_person_name}
                onChangeText={(t) => setEditFormData(prev => ({ ...prev, contact_person_name: t }))}
                placeholder="Full Name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('clientContact')} *</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                  value={editFormData.contact_number}
                  onChangeText={(t) => setEditFormData(prev => ({ ...prev, contact_number: t }))}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('alternateContact')}</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                  value={editFormData.alternate_contact_number}
                  onChangeText={(t) => setEditFormData(prev => ({ ...prev, alternate_contact_number: t }))}
                  keyboardType="phone-pad"
                  placeholder="Secondary #"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('email')}</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                  value={editFormData.email_address}
                  onChangeText={(t) => setEditFormData(prev => ({ ...prev, email_address: t }))}
                  keyboardType="email-address"
                  placeholder="email@example.com"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('gstinNumber')}</Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <TextInput
                    style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                    value={editFormData.gstin}
                    onChangeText={(t) => setEditFormData(prev => ({ ...prev, gstin: t }))}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    placeholderTextColor={colors.mutedForeground}
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
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('officeAddress')}</Text>
              <TextInput
                style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                value={editFormData.office_address}
                onChangeText={(t) => setEditFormData(prev => ({ ...prev, office_address: t }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleUpdateClient}
            style={{ backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 22, alignItems: 'center', marginTop: 32 }}
          >
            <Text style={{ color: "white", fontWeight: '900', fontSize: 16 }}>{t('saveUpdates')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      {/* Payment Form Modal */}
      <BottomSheet
        visible={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        title={t('addPayment')}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('amount')} *</Text>
              <TextInput
                style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('remarks')} *</Text>
              <TextInput
                style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", color: colors.foreground, padding: 16, borderRadius: 20, fontSize: 16, fontWeight: "600", borderWidth: 1, borderColor: colors.border }}
                value={paymentRemarks}
                onChangeText={setPaymentRemarks}
                placeholder="Payment details..."
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('paymentMode')}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {["CASH", "BANK"].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setPaymentMode(mode)}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: paymentMode === mode ? colors.primary : colors.border,
                      backgroundColor: paymentMode === mode ? colors.primary + "10" : "transparent",
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: paymentMode === mode ? colors.primary : colors.mutedForeground, fontWeight: 'bold' }}>
                      {t(mode.toLowerCase() as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{t('tripDate')}</Text>
              <View style={{ backgroundColor: isDark ? colors.card : colors.secondary + "10", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: "center" }}>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>{formatDate(paymentDate)}</Text>
                <Calendar size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleAddPayment}
            style={{ backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 22, alignItems: 'center', marginTop: 32 }}
          >
            <Text style={{ color: "white", fontWeight: '900', fontSize: 16 }}>{t('saveExpense')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      {showDatePicker && (
        <DateTimePicker value={paymentDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onPaymentDateChange} />
      )}
    </View>
  );
}

function SummaryCard({ label, value, green }: any) {
  const { colors } = useThemeStore();
  return (
    <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: green ? "#16a34a" : colors.foreground, fontSize: 18, fontWeight: 'bold' }}>₹{Number(value).toLocaleString()}</Text>
    </View>
  );
}

