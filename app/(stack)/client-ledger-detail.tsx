import { Ionicons } from "@expo/vector-icons";
import { NotificationBadge } from "../../components/NotificationBadge";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, Banknote, Calendar, Download, Edit, Eye, MapPin, Share2 } from "lucide-react-native";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "../../components/BottomSheet";
import { DatePickerModal } from "../../components/DatePickerModal";
import ProfileAvatar from "../../components/ProfileAvatar";

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
import { formatDate, formatPhoneNumber, normalizeGstinNumber, normalizePanNumber, toLocalYmd } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";
import API from "../../app/api/axiosInstance";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function ClientLedgerDetailScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { user, loading: userLoading } = useUser();
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
          <NotificationBadge size={24} color={colors.foreground} />
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
  } = useClientLedger();

  /* ---------------- STATE ---------------- */
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"unbilled" | "billed" | "settled">("unbilled");
  const [isClientExpanded, setIsClientExpanded] = useState(false);

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
  const [invoiceDueDate, setInvoiceDueDate] = useState<Date>(new Date());
  const [showInvoiceDueDatePicker, setShowInvoiceDueDatePicker] = useState(false);
  const [showDownloadSheet, setShowDownloadSheet] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDateField, setDownloadDateField] = useState<"start" | "end" | null>(null);
  const [downloadRange, setDownloadRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

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
    pan_number: "",
    gstin_details: undefined as any,
  });
  const PAYMENT_MODES = ["CASH", "BANK"] as const;
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


  // Invoice PDF generation (same approach as TripLog)
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
      const invoiceDate = formatDate(invoice.createdAt || new Date());
      const dueDate = invoice.due_date ? formatDate(invoice.due_date) : today;
      const money = (value: number) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
      const escapeHtml = (value: any) =>
        String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const partyName = user?.company_name || user?.name || "TRUCKSARTHI";
      const partyGstin = user?.gstin || (user as any)?.kyc_data?.gstin_details?.gstin || "-";
      const partyAddress =
        user?.address ||
        (user as any)?.kyc_data?.gstin_details?.principal_place_address ||
        "-";
      const partyPhone = user?.phone ? formatPhoneNumber(user.phone) : "-";
      const partyEmail = user?.email || "-";
      const partyBankName = user?.bank_name || "-";
      const partyAccountName = user?.account_holder_name || partyName;
      const partyAccountNumber = user?.account_number || "-";
      const partyIfsc = user?.ifsc_code || "-";

      const firstTrip = invoiceTrips[0];
      const defaultTruck = firstTrip ? truckMap[getId(firstTrip.truck)] || "-" : "-";

      const annexureRows = invoiceTrips
        .map((t, index) => {
          const tripTotal = Number(t.cost_of_trip) + Number(t.miscellaneous_expense || 0);
          const truckNumber = truckMap[getId(t.truck)] || "-";
          const driverName = driverMap[getId(t.driver)] || "-";
          const from = locationMap[getId(t.start_location)] || "-";
          const to = locationMap[getId(t.end_location)] || "-";

          return `
            <tr>
              <td class="center">${index + 1}</td>
              <td>${escapeHtml(t.trip_date ? formatDate(t.trip_date) : "-")}</td>
              <td>${escapeHtml(truckNumber)}</td>
              <td>${escapeHtml(driverName)}</td>
              <td>${escapeHtml(from)}</td>
              <td>${escapeHtml(to)}</td>
              <td class="right">${money(Number(t.cost_of_trip || 0))}</td>
              <td class="right">${money(Number(t.miscellaneous_expense || 0))}</td>
              <td class="right">${money(tripTotal)}</td>
            </tr>
          `;
        })
        .join("");

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 10mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      color: #111;
      font-size: 10px;
      line-height: 1.25;
    }
    .page { width: 100%; }
    .page-break { page-break-before: always; }

    .invoice-frame {
      border: 1.2px solid #111;
    }
    .row { display: flex; width: 100%; }
    .b-b { border-bottom: 1px solid #111; }
    .b-r { border-right: 1px solid #111; }
    .cell { padding: 5px 6px; box-sizing: border-box; }

    .gst-col {
      width: 9%;
      min-height: 92px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .gst-label {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.3px;
    }
    .gst-value {
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.4px;
    }

    .head-main { width: 69%; min-height: 92px; }
    .head-right { width: 22%; min-height: 92px; }
    .tax-title {
      text-align: center;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.8px;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .brand {
      text-align: center;
      font-size: 42px;
      letter-spacing: 1px;
      line-height: 1;
      font-weight: 800;
      margin: 2px 0;
    }
    .muted { color: #333; font-size: 9.5px; }
    .center { text-align: center; }
    .right { text-align: right; }
    .label { font-weight: 700; text-transform: uppercase; font-size: 9px; }
    .val { font-size: 10.5px; font-weight: 700; margin-top: 2px; }

    .receiver-left { width: 74%; min-height: 82px; }
    .receiver-right { width: 26%; min-height: 82px; }
    .line-item { margin-top: 3px; }

    .items {
      width: 100%;
      border-collapse: collapse;
      border-left: 1px solid #111;
      border-right: 1px solid #111;
      border-bottom: 1px solid #111;
      table-layout: fixed;
    }
    .items th,
    .items td {
      border: 1px solid #111;
      padding: 5px 6px;
      vertical-align: top;
      font-size: 9.8px;
    }
    .items th {
      text-transform: uppercase;
      font-size: 8.7px;
      letter-spacing: 0.3px;
      background: #f7f7f7;
      font-weight: 700;
    }
    .items .spacer-row td {
      height: 170px;
    }

    .bottom-wrap {
      display: flex;
      border-left: 1px solid #111;
      border-right: 1px solid #111;
      border-bottom: 1px solid #111;
      min-height: 145px;
    }
    .amount-words {
      width: 64%;
      border-right: 1px solid #111;
      padding: 6px;
      box-sizing: border-box;
    }
    .totals-box {
      width: 36%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    .tot-line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #111;
      padding: 6px;
      font-size: 10px;
    }
    .tot-line:last-child { border-bottom: 0; }
    .grand { font-weight: 800; font-size: 11px; }

    .declaration {
      border-left: 1px solid #111;
      border-right: 1px solid #111;
      border-bottom: 1px solid #111;
      display: flex;
    }
    .decl-left {
      width: 62%;
      border-right: 1px solid #111;
      padding: 6px;
      box-sizing: border-box;
      min-height: 86px;
    }
    .decl-right {
      width: 38%;
      padding: 6px;
      box-sizing: border-box;
      min-height: 86px;
      position: relative;
    }
    .sign {
      position: absolute;
      bottom: 8px;
      right: 8px;
      font-size: 9px;
      color: #333;
    }
    .small-note {
      border-left: 1px solid #111;
      border-right: 1px solid #111;
      border-bottom: 1px solid #111;
      padding: 4px 6px;
      font-size: 8.7px;
      color: #444;
    }

    .section-title {
      margin: 0 0 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-size: 12px;
    }
    .annexure-meta {
      font-size: 9.5px;
      margin-bottom: 8px;
      color: #333;
    }
    .annexure {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid #111;
    }
    .annexure th,
    .annexure td {
      border: 1px solid #111;
      padding: 5px 6px;
      font-size: 9.6px;
    }
    .annexure th {
      background: #f7f7f7;
      text-transform: uppercase;
      font-size: 8.6px;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="invoice-frame">
      <div class="row b-b">
        <div class="cell gst-col b-r">
          <div class="gst-label">GSTIN NO.</div>
          <div class="gst-value">${escapeHtml(partyGstin)}</div>
        </div>

        <div class="cell head-main b-r">
          <div class="tax-title">Tax Invoice</div>
          <div class="brand">${escapeHtml(partyName)}</div>
          <div class="center muted">${escapeHtml(partyAddress)}</div>
          <div class="center muted">Ph: ${escapeHtml(partyPhone)}, Email: ${escapeHtml(partyEmail)}</div>
        </div>

        <div class="cell head-right">
          <div class="label">Invoice No.</div>
          <div class="val">${escapeHtml(invoice.invoice_number || "-")}</div>
          <div class="label" style="margin-top:10px;">Date</div>
          <div class="val">${escapeHtml(invoiceDate)}</div>
        </div>
      </div>

      <div class="row b-b">
        <div class="cell receiver-left b-r">
          <div class="label">Details of Receiver</div>
          <div class="line-item"><strong>Name:</strong> ${escapeHtml(client?.client_name || "-")}</div>
          <div class="line-item"><strong>Address:</strong> ${escapeHtml(client?.office_address || "-")}</div>
          <div class="line-item"><strong>State:</strong> ${escapeHtml(client?.gstin_details?.state_name || "-")}</div>
          <div class="line-item"><strong>GSTIN:</strong> ${escapeHtml(client?.gstin || "-")}</div>
        </div>

        <div class="cell receiver-right">
          <div class="line-item"><strong>State Code:</strong> ${escapeHtml(client?.gstin?.slice(0, 2) || "-")}</div>
          <div class="line-item"><strong>Due Date:</strong> ${escapeHtml(dueDate)}</div>
          <div class="line-item"><strong>Total Trips:</strong> ${invoiceTrips.length}</div>
          <div class="line-item"><strong>Tax Type:</strong> ${escapeHtml(taxTypeLabel)}</div>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width:7%">Date</th>
          <th style="width:8%">G.C. No.</th>
          <th style="width:11%">Vehicle No.</th>
          <th>Particulars</th>
          <th style="width:10%">HSN/SAC</th>
          <th style="width:11%">Rate</th>
          <th style="width:12%">Total Value ? </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(invoiceDate)}</td>
          <td class="center">-</td>
          <td>${escapeHtml(defaultTruck)}</td>
          <td>Freight charges for transportation services as per annexure (${invoiceTrips.length} trips)</td>
          <td class="center">9965</td>
          <td class="right">${money(invoiceSubtotal)}</td>
          <td class="right">${money(invoiceSubtotal)}</td>
        </tr>
        <tr class="spacer-row">
          <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        </tr>
      </tbody>
    </table>

    <div class="bottom-wrap">
      <div class="amount-words">
        <div class="label">Rupees in words</div>
        <div style="margin-top:4px;">Total Invoice Amount: ₹ ${money(grandTotal)} only</div>
      </div>
      <div class="totals-box">
        <div class="tot-line">
          <span>Total</span>
          <span>${money(invoiceSubtotal)}</span>
        </div>
        ${taxPercentage > 0 ? (
          invoice.tax_type === "cgst_sgst" ? `
            <div class="tot-line"><span>CGST @ ${taxPercentage / 2}%</span><span>${money(tax / 2)}</span></div>
            <div class="tot-line"><span>SGST @ ${taxPercentage / 2}%</span><span>${money(tax / 2)}</span></div>
          ` : `
            <div class="tot-line"><span>IGST @ ${taxPercentage}%</span><span>${money(tax)}</span></div>
          `
        ) : `<div class="tot-line"><span>Tax</span><span>0.00</span></div>`}
        <div class="tot-line grand">
          <span>G. TOTAL</span>
          <span>${money(grandTotal)}</span>
        </div>
      </div>
    </div>

    <div class="declaration">
      <div class="decl-left">
        <div class="label">Certified that the particulars given above are true and correct</div>
        <div class="muted" style="margin-top:8px;">
          <strong>Bank Details:</strong><br/>
          Bank Name: ${escapeHtml(partyBankName)}<br/>
          A/C Name: ${escapeHtml(partyAccountName)}<br/>
          A/C No.: ${escapeHtml(partyAccountNumber)}<br/>
          IFSC: ${escapeHtml(partyIfsc)}
        </div>
      </div>
      <div class="decl-right">
        <div class="label right">For ${escapeHtml(partyName)}</div>
        <div class="sign">Authorised Signatory</div>
      </div>
    </div>

    <div class="small-note">Generated on ${escapeHtml(today)}</div>
  </div>

  <div class="page page-break">
    <h2 class="section-title">Annexure - Trip Details</h2>
    <div class="annexure-meta">Invoice No: ${escapeHtml(invoice.invoice_number || "-")} | Client: ${escapeHtml(client?.client_name || "-")}</div>

    <table class="annexure">
      <thead>
        <tr>
          <th style="width:6%">S No.</th>
          <th style="width:12%">Date</th>
          <th style="width:13%">Vehicle No.</th>
          <th style="width:13%">Driver</th>
          <th>From</th>
          <th>To</th>
          <th style="width:11%" class="right">Freight</th>
          <th style="width:11%" class="right">Misc.</th>
          <th style="width:11%" class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${annexureRows || `<tr><td colspan="9" class="center">No trips found</td></tr>`}
      </tbody>
    </table>
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

  // ðŸ’° CALCULATED AMOUNTS
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

  const getEntriesForRange = useCallback(
    (range: { startDate: Date; endDate: Date }) => {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      return (entries || []).filter((entry: any) => {
        const entryDate = new Date(entry?.entry_date || entry?.date || entry?.createdAt || 0);
        return entryDate >= start && entryDate <= end;
      });
    },
    [entries]
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const entriesForRange = getEntriesForRange(downloadRange);
      const debitTotal = entriesForRange
        .filter((entry: any) => String(entry?.entry_type || "").toLowerCase() === "debit")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const creditTotal = entriesForRange
        .filter((entry: any) => String(entry?.entry_type || "").toLowerCase() === "credit")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const difference = debitTotal - creditTotal;

      const rowsHtml = entriesForRange
        .map((entry: any, index: number) => {
          const type = String(entry?.entry_type || "").toLowerCase();
          const isDebit = type === "debit";
          const debit = isDebit ? `₹ ${Number(entry.amount || 0).toLocaleString()}` : "";
          const credit = !isDebit ? `₹ ${Number(entry.amount || 0).toLocaleString()}` : "";
          const title = entry.remarks || (isDebit ? "Invoice" : "Payment Received");
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatDate(entry.entry_date || entry.date))}</td>
            <td>${escapeHtml(title)}</td>
            <td class="debit">${escapeHtml(debit)}</td>
            <td class="credit">${escapeHtml(credit)}</td>
          </tr>`;
        })
        .join("");

      const totalsHtml = `
          <tr class="totals">
            <td colspan="3">Totals</td>
            <td class="debit">₹ ${debitTotal.toLocaleString()}</td>
            <td class="credit">₹ ${creditTotal.toLocaleString()}</td>
          </tr>
          <tr class="difference">
            <td colspan="3">Difference (Debit - Credit)</td>
            <td colspan="2" class="diff">${difference >= 0 ? "" : "-"}₹ ${Math.abs(difference).toLocaleString()}</td>
          </tr>`;

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0; font-size: 22px; }
          .client { margin-top: 6px; font-size: 18px; font-weight: 800; }
          .sub { margin-top: 4px; color: #6b7280; font-size: 12px; }
          .cards { margin-top: 12px; display: flex; gap: 10px; }
          .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
          .label { color: #6b7280; font-size: 11px; }
          .value { margin-top: 4px; font-size: 15px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
          th { background: #111827; color: white; text-align: left; padding: 8px; }
          td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
          .debit { color: #b91c1c; font-weight: 700; }
          .credit { color: #15803d; font-weight: 700; }
          .totals td { font-weight: 700; background: #f9fafb; }
          .difference td { font-weight: 800; background: #f3f4f6; }
          .diff { text-align: left; }
          .disclaimer { margin-top: 16px; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Client Ledger</h1>
        <div class="client">${escapeHtml(client?.client_name || "Client")}</div>
        <div class="sub">Period: ${escapeHtml(formatDate(downloadRange.startDate))} - ${escapeHtml(formatDate(downloadRange.endDate))}</div>
        <div class="cards">
          <div class="card"><div class="label">Debit</div><div class="value">₹ ${debitTotal.toLocaleString()}</div></div>
          <div class="card"><div class="label">Credit</div><div class="value">₹ ${creditTotal.toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${(rowsHtml || `<tr><td colspan="5">No entries found for this range.</td></tr>`) + totalsHtml}</tbody>
        </table>
        <div class="disclaimer">Disclaimer: Transactions exist before and after this date range.</div>
      </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const cleanName = (client?.client_name || "client").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32);
      const targetUri = `${FileSystem.documentDirectory}Client-Ledger-${cleanName}-${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(targetUri);
      else Alert.alert("Report Ready", `Saved at: ${targetUri}`);
      setShowDownloadSheet(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate client ledger PDF");
    } finally {
      setDownloading(false);
    }
  };

  const applyDownloadDate = (field: "start" | "end", selectedDate: Date) => {
    if (field === "start") {
      setDownloadRange((prev) => ({
        startDate: selectedDate,
        endDate: prev.endDate < selectedDate ? selectedDate : prev.endDate,
      }));
      return;
    }
    setDownloadRange((prev) => ({
      startDate: prev.startDate > selectedDate ? selectedDate : prev.startDate,
      endDate: selectedDate,
    }));
  };

  const openDownloadDatePicker = (field: "start" | "end") => {
    setDownloadDateField(field);
  };

  const closeDownloadDatePicker = () => setDownloadDateField(null);

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

  const onInvoiceDueDateChange = (event: any, selectedDate?: Date) => {
    setShowInvoiceDueDatePicker(false);
    if (selectedDate) {
      setInvoiceDueDate(selectedDate);
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
      due_date: toLocalYmd(invoiceDueDate),
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
        pan_number: client.pan_number || "",
        gstin_details: client.gstin_details || undefined,
      });
      setShowEditModal(true);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
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
      Alert.alert("Missing Fields", `Please fill the following required fields:\n\n- ${labels.join("\n- ")}`);
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

  // Still loading or clients array not yet populated, show skeleton
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

  const hasGstinInEdit = Boolean(String(editFormData.gstin || "").trim());
  const profileRows = [
    { label: t("contactPerson"), value: String(client.contact_person_name || "").trim() },
    { label: t("clientContact"), value: client.contact_number ? formatPhoneNumber(client.contact_number) : "" },
    { label: t("email"), value: String(client.email_address || "").trim() },
    { label: t("officeAddress"), value: String(client.office_address || "").trim() },
    { label: "GSTIN", value: String(client.gstin || "").trim() },
    { label: "PAN", value: String((client as any).pan_number || "").trim() },
  ].filter((row) => row.value.length > 0);

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
            <TouchableOpacity
              onPress={() => setShowDownloadSheet(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Download size={16} color={colors.foreground} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Client Card */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setIsClientExpanded((prev) => !prev)}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <View style={{ marginRight: 16 }}>
                <ProfileAvatar name={client.client_name} size="large" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  {client.client_name}
                </Text>
                {client.gstin ? (
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    GSTIN: {client.gstin}
                  </Text>
                ) : null}
              </View>

              <View style={{ paddingRight: 8 }}>
                <Ionicons name={isClientExpanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <TouchableOpacity
                onPress={openEditModal}
                style={{ backgroundColor: colors.muted, padding: 8, borderRadius: 20 }}
              >
                <Edit size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() =>
                client.contact_number &&
                Linking.openURL(`tel:${client.contact_number}`)
              }
              style={{ flex: 1, backgroundColor: colors.muted, paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>{t('call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                client.contact_number &&
                Linking.openURL(
                  `https://wa.me/91${client.contact_number}?text=Hello ${client.client_name}`
                )
              }
              style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="logo-whatsapp" size={18} color={colors.primaryForeground} />
                <Text style={{ fontWeight: '600', fontSize: 14, color: colors.primaryForeground }}>
                  WhatsApp
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {isClientExpanded && (
            <View style={{ marginTop: 14, gap: 8 }}>
              <View style={{ gap: 4 }}>
                {profileRows.map((row) => (
                  <Text key={row.label} style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {row.label}: {row.value}
                  </Text>
                ))}
              </View>
            </View>
          )}
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
                shadowColor: activeTab === tab ? colors.shadow : colors.transparent,
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
                <TouchableOpacity
                  onPress={() => {
                    setInvoiceDueDate(new Date());
                    setShowInvoiceConfigForm(true);
                  }}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text style={{ color: colors.primaryForeground, fontWeight: 'bold' }} className="text-xs">{t('generateInvoice')} ({selectedTrips.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {clientTrips.filter(t => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced").length > 0 ? (
              clientTrips.filter(t => normalizeInvoiceStatus(t.invoiced_status) === "not_invoiced").map(trip => (
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
                      <Text className="font-bold" style={{ color: colors.foreground }}>Trip #{trip.public_id || getId(trip).slice(-6)}</Text>
                      {trip.trip_date ? <Text className="text-xs" style={{ color: colors.mutedForeground }}>{formatDate(trip.trip_date)}</Text> : null}
                    </View>
                    <Text className="font-bold text-lg" style={{ color: colors.foreground }}>₹{(Number(trip.cost_of_trip) + Number(trip.miscellaneous_expense || 0)).toLocaleString()}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <MapPin size={14} color={colors.mutedForeground} />
                    <Text className="text-xs" style={{ color: colors.mutedForeground }} numberOfLines={1}>
                      {locationMap[getId(trip.start_location)]} {" -> "} {locationMap[getId(trip.end_location)]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState message={t('noPendingTrips') || "No pending trips found"} />
            )}
          </View>
        )}

        {activeTab === "billed" && (
          <View>
            <Text className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>{t('billed')}</Text>
            {clientInvoices.length > 0 ? (
              clientInvoices.map(invoice => {
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
                      <View className="px-2 py-1 rounded-md" style={{ backgroundColor: invoice.status === 'paid' ? colors.successSoft : colors.destructiveSoft }}>
                        <Text className="font-bold text-[10px] uppercase" style={{ color: invoice.status === 'paid' ? colors.success : colors.destructive }}>{invoice.status}</Text>
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
                        {invoice.status !== 'paid' && (
                          <TouchableOpacity onPress={() => handleSettleInvoice(invoice)} className="px-4 py-2 rounded-full" style={{ backgroundColor: colors.primary }}>
                            <Text style={{ color: colors.primaryForeground, fontWeight: 'bold' }} className="text-xs">Settle</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })
            ) : (
              <EmptyState message={t('noInvoicesFound') || "No invoices found for this client"} />
            )}
          </View>
        )}

        {activeTab === "settled" && (
          <View>
            <Text className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>{t('paymentHistory')}</Text>
            {entries.filter(e => e.entry_type === 'credit').length > 0 ? (
              entries.filter(e => e.entry_type === 'credit').map(entry => (
                <View key={getId(entry)} className="p-4 rounded-2xl mb-3 border flex-row items-start" style={{ backgroundColor: colors.card, borderColor: colors.border + '80' }}>
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.successSoft }}>
                    <ArrowDownLeft size={20} color={colors.success} />
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
                    <View className="px-2 py-1 rounded-md mb-1" style={{ backgroundColor: (entry.payment_type === "PARTIAL" || paymentCountsByInvoice[getId((entry as any).invoice || (entry as any).invoice_id)] > 1) ? colors.warningSoft : colors.successSoft }}>
                      <Text className="text-[10px] font-bold" style={{ color: (entry.payment_type === "PARTIAL" || paymentCountsByInvoice[getId((entry as any).invoice || (entry as any).invoice_id)] > 1) ? colors.warning : colors.success }}>
                        {(entry.payment_type === "PARTIAL" || paymentCountsByInvoice[getId((entry as any).invoice || (entry as any).invoice_id)] > 1) ? "PARTIAL" : "FULL"}
                      </Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.success }}>₹{Number(entry.amount).toLocaleString()}</Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState message={t('noPaymentsFound') || "No payment history found"} />
            )}
          </View>
        )}



        <BottomSheet
          visible={showInvoiceConfigForm}
          onClose={() => setShowInvoiceConfigForm(false)}
          title="Generate Invoice"
          subtitle={`${selectedTrips.length} trip(s) selected`}
          maxHeight="90%"
          >
            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={140}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="mb-6">
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Due Date</Text>
                <TouchableOpacity
                  onPress={() => setShowInvoiceDueDatePicker(true)}
                  className="flex-row items-center rounded-2xl px-4 py-4"
                  style={{ backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border + '30' }}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <Text className="text-base font-bold" style={{ color: colors.foreground }}>{formatDate(invoiceDueDate)}</Text>
                </TouchableOpacity>
                {showInvoiceDueDatePicker && (
                  <DateTimePicker value={invoiceDueDate} mode="date" display="default" onChange={onInvoiceDueDateChange} />
                )}
              </View>

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

	            <TouchableOpacity
	              onPress={handleGenerateInvoice}
	              style={{ backgroundColor: colors.primary }}
	              className="py-4 rounded-[18px]"
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 16 }} className="text-center">
                CREATE INVOICE
              </Text>
            </TouchableOpacity>
            </KeyboardAwareScrollView>
        </BottomSheet>

        <BottomSheet
          visible={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          title="Add Payment"
          subtitle={client?.client_name || "Client"}
          maxHeight="90%"
        >
          <KeyboardAwareScrollView
            enableOnAndroid
            extraScrollHeight={140}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* DATE PICKER */}
            <View className="mb-6">
              <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center rounded-2xl px-4 py-4"
                style={{ backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border + '30' }}
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
              <View className="flex-row items-center rounded-2xl px-5 py-4" style={{ backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border + '30' }}>
                <Banknote size={24} color={colors.success} />
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
                  backgroundColor: colors.input,
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
                      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>{mode}</Text>
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
                <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 18 }} className="text-center font-black">SAVE PAYMENT</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </BottomSheet>

        <BottomSheet
          visible={showEditModal}
          onClose={closeEditModal}
          title={t('editClient')}
          subtitle="Update business profile"
          maxHeight="90%"
        >
          <KeyboardAwareScrollView
            enableOnAndroid
            extraScrollHeight={140}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="gap-5">
              <View>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>{t('clientName')} *</Text>
                <TextInput
                  className="p-4 rounded-2xl font-bold"
                  style={{ backgroundColor: colors.input, color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
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
                  style={{ backgroundColor: colors.input, color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
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
                    style={{ backgroundColor: colors.input, color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
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
                    style={{ backgroundColor: colors.input, color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                    value={editFormData.email_address}
                    onChangeText={(t) => setEditFormData(prev => ({ ...prev, email_address: t }))}
                    keyboardType="email-address"
                    placeholderTextColor={colors.mutedForeground + '60'}
                  />
                </View>
              </View>

              <View>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>
                  {hasGstinInEdit ? "GSTIN Number" : "PAN Number"}
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <TextInput
                      className="p-4 rounded-2xl font-bold"
                      style={{ backgroundColor: colors.input, color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
                      value={hasGstinInEdit ? editFormData.gstin : String(editFormData.pan_number || "")}
                      onChangeText={(t) =>
                        setEditFormData(prev =>
                          hasGstinInEdit
                            ? { ...prev, gstin: normalizeGstinNumber(t) }
                            : { ...prev, pan_number: normalizePanNumber(t) }
                        )
                      }
                      placeholder={hasGstinInEdit ? "e.g. 29ABCDE1234F1Z5" : "e.g. ABCDE1234F"}
                      placeholderTextColor={colors.mutedForeground + '60'}
                      autoCapitalize="characters"
                      maxLength={hasGstinInEdit ? 15 : 10}
                    />
                  </View>
                  {hasGstinInEdit ? (
                    <TouchableOpacity
                      onPress={verifyGSTIN}
                      disabled={verifyingGstin || !editFormData.gstin}
                      style={{ backgroundColor: editFormData.gstin ? colors.primary : colors.muted }}
                      className="w-20 rounded-2xl items-center justify-center border border-border/50"
                    >
                      <Text style={{ color: editFormData.gstin ? colors.primaryForeground : colors.mutedForeground }} className="font-bold text-[10px] uppercase tracking-widest text-center px-1">
                        {verifyingGstin ? "Verifying..." : "Verify\n& Fill"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>{t('officeAddress')} *</Text>
                <TextInput
                  className="p-4 rounded-2xl font-bold"
                  style={{ backgroundColor: colors.input, color: colors.foreground, borderWidth: 1, borderColor: colors.border + '30' }}
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
                  <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 18 }} className="text-center font-black">{t('saveUpdates').toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </BottomSheet>

        <BottomSheet
          visible={showDownloadSheet}
          onClose={() => {
            setShowDownloadSheet(false);
            closeDownloadDatePicker();
          }}
          title="Download Ledger"
          subtitle="Choose a date range"
          maxHeight="70%"
        >
          <View style={{ gap: 14, paddingBottom: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              Select the period you want to include in the PDF.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => openDownloadDatePicker("start")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Calendar size={14} color={colors.mutedForeground} />
                <View>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Start</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>{formatDate(downloadRange.startDate)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openDownloadDatePicker("end")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Calendar size={14} color={colors.mutedForeground} />
                <View>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>End</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>{formatDate(downloadRange.endDate)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <DatePickerModal
              visible={downloadDateField === "start"}
              date={downloadRange.startDate}
              onClose={closeDownloadDatePicker}
              onChange={(selectedDate) => applyDownloadDate("start", selectedDate)}
            />

            <DatePickerModal
              visible={downloadDateField === "end"}
              date={downloadRange.endDate}
              onClose={closeDownloadDatePicker}
              onChange={(selectedDate) => applyDownloadDate("end", selectedDate)}
            />

            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                opacity: downloading ? 0.7 : 1,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 14 }}>
                {downloading ? "Generating PDF..." : "Download PDF"}
              </Text>
            </TouchableOpacity>
          </View>
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

function EmptyState({ message }: { message: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
      <Image
        source={require('../../assets/images/no-result-found.png')}
        style={{ width: 200, height: 200, resizeMode: 'contain', opacity: 0.8 }}
      />
      <Text style={{ color: colors.mutedForeground, marginTop: 16, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}
