import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Edit3, Trash2 } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";

import API from "../api/axiosInstance";
import BottomSheet from "../../components/BottomSheet";
import BiltyModal, { BiltyFormData } from "../../components/BiltyModal";
import EditTripModal from "../../components/EditTripModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import useDrivers from "../../hooks/useDriver";
import useClients from "../../hooks/useClient";
import useTrucks from "../../hooks/useTruck";
import useLocations from "../../hooks/useLocation";
import { useInvoices } from "../../hooks/useInvoice";
import { useBilty } from "../../hooks/useBiltyModule";
import { formatDate, formatPhoneNumber } from "../../lib/utils";
import type { Trip, TripEditHistoryEntry } from "../../types/entity";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function TripDetail() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const { user } = useUser();

  const { drivers, fetchDrivers } = useDrivers();
  const { clients, fetchClients } = useClients();
  const { trucks, fetchTrucks } = useTrucks();
  const { locations, fetchLocations } = useLocations();
  const { fetchInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { createBilty, getBiltyByTrip, deleteBilty } = useBilty();

  const [loading, setLoading] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showEditTripModal, setShowEditTripModal] = useState(false);

  // Invoice states
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const [invoiceTaxType, setInvoiceTaxType] = useState<"none" | "igst" | "cgst_sgst">("none");
  const [invoiceTaxPercentage, setInvoiceTaxPercentage] = useState<0 | 5 | 18>(0);
  const [invoiceDueDate, setInvoiceDueDate] = useState<Date>(new Date());
  const [showInvoiceDueDatePicker, setShowInvoiceDueDatePicker] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceEditMode, setInvoiceEditMode] = useState(false);

  // Bilty states
  const [showBiltySheet, setShowBiltySheet] = useState(false);
  const [biltyBusy, setBiltyBusy] = useState(false);
  const [bilty, setBilty] = useState<any>(null);
  const [biltyFormData, setBiltyFormData] = useState<BiltyFormData>({
    consignor: {},
    consignee: {},
  });

  useEffect(() => {
    fetchDrivers();
    fetchClients();
    fetchTrucks();
    fetchLocations();
  }, [fetchDrivers, fetchClients, fetchTrucks, fetchLocations]);

  useEffect(() => {
    let cancelled = false;

    const loadTrip = async () => {
      if (!tripId) return;
      try {
        setLoading(true);
        const biltyPromise = getBiltyByTrip(String(tripId))
          .then((existingBilty) => {
            if (!cancelled) setBilty(existingBilty || null);
          })
          .catch((err) => {
            console.error("Failed to load bilty:", err);
            if (!cancelled) setBilty(null);
          });

        const res = await API.get(`/api/trips/${tripId}`);
        if (cancelled) return;

        setTrip(res.data);
        setLoading(false);

        // Load invoice and bilty in parallel after trip is rendered.
        const tripData = res.data;
        const loadInvoiceTask = async () => {
          if (tripData?.invoiced_status !== "invoiced") {
            if (!cancelled) setInvoice(null);
            return;
          }

          try {
            const invoiceList = await fetchInvoices();
            const matchedInvoice = (invoiceList as any[]).find((inv) =>
              (inv?.items || []).some((it: any) => String(getId(it?.trip)) === String(tripData._id))
            );

            if (!matchedInvoice?._id) {
              if (!cancelled) setInvoice(null);
              return;
            }

            const full = await getInvoiceById(String(matchedInvoice._id));
            if (!cancelled) setInvoice(full);
          } catch (err) {
            console.error("Failed to load invoice:", err);
          }
        };

        void Promise.allSettled([loadInvoiceTask(), biltyPromise]);
      } catch {
        if (!cancelled) {
          setTrip(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadTrip();

    return () => {
      cancelled = true;
    };
  }, [tripId, fetchInvoices, getInvoiceById, getBiltyByTrip]);

  const reloadTrip = async () => {
    if (!tripId) return;
    try {
      const res = await API.get(`/api/trips/${tripId}`);
      setTrip(res.data);
    } catch {
      // ignore
    }
  };

  const onInvoiceDueDateChange = (_event: any, selectedDate?: Date) => {
    setShowInvoiceDueDatePicker(false);
    if (selectedDate) {
      setInvoiceDueDate(selectedDate);
    }
  };

  const getId = (obj: any): string => (typeof obj === "object" ? String(obj?._id || "") : String(obj || ""));

  const getDriverName = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = drivers.find((v) => String(v._id) === sId);
    if (found) return found.driver_name || found.name || "N/A";
    if (typeof idOrObj === "object") return idOrObj.driver_name || idOrObj.name || "N/A";
    return sId.slice(-6) || "N/A";
  };

  const getClientName = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = clients.find((c) => String(c._id) === sId);
    if (found) return found.client_name || "N/A";
    if (typeof idOrObj === "object") return idOrObj.client_name || "N/A";
    return sId.slice(-6) || "N/A";
  };

  const getTruckReg = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = trucks.find((t) => String(t._id) === sId);
    if (found) return found.registration_number || "N/A";
    if (typeof idOrObj === "object") return idOrObj.registration_number || "N/A";
    return sId.slice(-6) || "N/A";
  };

  const getLocationName = (idOrObj: any) => {
    if (!idOrObj) return "N/A";
    const id = typeof idOrObj === "object" ? idOrObj?._id : idOrObj;
    const sId = id ? String(id) : "";
    const found = locations.find((l) => String(l._id) === sId);
    if (found) return found.location_name || "N/A";
    if (typeof idOrObj === "object") return idOrObj.location_name || "N/A";
    return sId.slice(-6) || "N/A";
  };

  const history = useMemo(() => {
    const items = (trip?.edit_history || []) as TripEditHistoryEntry[];
    return [...items].sort((a, b) => {
      const da = new Date(a.edited_at as any).getTime();
      const db = new Date(b.edited_at as any).getTime();
      return db - da;
    });
  }, [trip]);

  if (loading && !trip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>Trip not found</Text>
      </View>
    );
  }

  const freightAmount = Number(trip.cost_of_trip || 0);
  const miscAmount = Number(trip.miscellaneous_expense || 0);
  const advanceAmount = Number(trip.advance || 0);
  const totalCost = freightAmount + miscAmount;
  const netTripAmount = Math.max(totalCost - advanceAmount, 0);
  const isBilled = String(trip.invoiced_status || "") === "invoiced";

  const buildInvoiceHtml = (invoice: any) => {
    const invoiceTrips = [
      {
        ...trip,
        cost_of_trip: Number(invoice?.items?.[0]?.trip_cost ?? trip.cost_of_trip ?? 0),
        miscellaneous_expense: Number(invoice?.items?.[0]?.misc_expense ?? trip.miscellaneous_expense ?? 0),
        advance: Number(invoice?.items?.[0]?.advance ?? trip.advance ?? 0),
      },
    ];

    const grossSubtotal = invoiceTrips.reduce(
      (acc, t) => acc + Number(t.cost_of_trip) + Number(t.miscellaneous_expense || 0),
      0
    );
    const advanceSubtotal = invoiceTrips.reduce((acc, t) => acc + Number((t as any).advance || 0), 0);
    const invoiceSubtotal = Math.max(grossSubtotal - advanceSubtotal, 0);
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

    const partyName = user?.company_name || user?.name || "TRUCKSARTHI";
    const partyGstin = user?.gstin || (user as any)?.kyc_data?.gstin_details?.gstin || "-";
    const partyAddress = user?.address || (user as any)?.kyc_data?.gstin_details?.principal_place_address || "-";
    const partyPhone = user?.phone ? formatPhoneNumber(user.phone) : "-";
    const partyEmail = user?.email || "-";
    const partyBankName = user?.bank_name || "-";
    const partyAccountName = user?.account_holder_name || partyName;
    const partyAccountNumber = user?.account_number || "-";
    const partyIfsc = user?.ifsc_code || "-";

    const clientObj = clients.find((c) => String(c._id) === String(getId(trip.client)));
    const defaultTruck = getTruckReg(trip.truck) || "-";

    const annexureRows = invoiceTrips
      .map((t, index) => {
        const tripTotal = Number(t.cost_of_trip) + Number(t.miscellaneous_expense || 0);
        const tripAdvance = Number((t as any).advance || 0);
        const tripNet = Math.max(tripTotal - tripAdvance, 0);
        return `
          <tr>
            <td class="center">${index + 1}</td>
            <td>${escapeHtml(t.trip_date ? formatDate(t.trip_date) : "-")}</td>
            <td>${escapeHtml(getTruckReg(t.truck) || "-")}</td>
            <td>${escapeHtml(getDriverName(t.driver) || "-")}</td>
            <td>${escapeHtml(getLocationName(t.start_location) || "-")}</td>
            <td>${escapeHtml(getLocationName(t.end_location) || "-")}</td>
            <td class="right">${money(Number(t.cost_of_trip || 0))}</td>
            <td class="right">${money(Number(t.miscellaneous_expense || 0))}</td>
            <td class="right">${money(tripAdvance)}</td>
            <td class="right">${money(tripNet)}</td>
          </tr>
        `;
      })
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111; font-size: 10px; line-height: 1.25; }
    .page { width: 100%; }
    .page-break { page-break-before: always; }
    .invoice-frame { border: 1.2px solid #111; }
    .row { display: flex; width: 100%; }
    .b-b { border-bottom: 1px solid #111; }
    .b-r { border-right: 1px solid #111; }
    .cell { padding: 5px 6px; box-sizing: border-box; }
    .gst-col { width: 9%; min-height: 92px; display: flex; flex-direction: column; justify-content: space-between; }
    .gst-label { font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; }
    .gst-value { font-weight: 700; font-size: 12px; letter-spacing: 0.4px; }
    .head-main { width: 69%; min-height: 92px; }
    .head-right { width: 22%; min-height: 92px; }
    .tax-title { text-align: center; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; font-size: 11px; margin-bottom: 3px; }
    .brand { text-align: center; font-size: 42px; letter-spacing: 1px; line-height: 1; font-weight: 800; margin: 2px 0; }
    .muted { color: #333; font-size: 9.5px; }
    .center { text-align: center; }
    .right { text-align: right; }
    .label { font-weight: 700; text-transform: uppercase; font-size: 9px; }
    .val { font-size: 10.5px; font-weight: 700; margin-top: 2px; }
    .receiver-left { width: 74%; min-height: 82px; }
    .receiver-right { width: 26%; min-height: 82px; }
    .line-item { margin-top: 3px; }
    .items { width: 100%; border-collapse: collapse; border-left: 1px solid #111; border-right: 1px solid #111; border-bottom: 1px solid #111; table-layout: fixed; }
    .items th, .items td { border: 1px solid #111; padding: 5px 6px; vertical-align: top; font-size: 9.8px; }
    .items th { text-transform: uppercase; font-size: 8.7px; letter-spacing: 0.3px; background: #f7f7f7; font-weight: 700; }
    .items .spacer-row td { height: 170px; }
    .bottom-wrap { display: flex; border-left: 1px solid #111; border-right: 1px solid #111; border-bottom: 1px solid #111; min-height: 145px; }
    .amount-words { width: 64%; border-right: 1px solid #111; padding: 6px; box-sizing: border-box; }
    .totals-box { width: 36%; box-sizing: border-box; display: flex; flex-direction: column; }
    .tot-line { display: flex; justify-content: space-between; border-bottom: 1px solid #111; padding: 6px; font-size: 10px; }
    .tot-line:last-child { border-bottom: 0; }
    .grand { font-weight: 800; font-size: 11px; }
    .declaration { border-left: 1px solid #111; border-right: 1px solid #111; border-bottom: 1px solid #111; display: flex; }
    .decl-left { width: 62%; border-right: 1px solid #111; padding: 6px; box-sizing: border-box; min-height: 86px; }
    .decl-right { width: 38%; padding: 6px; box-sizing: border-box; min-height: 86px; position: relative; }
    .sign { position: absolute; bottom: 8px; right: 8px; font-size: 9px; color: #333; }
    .small-note { border-left: 1px solid #111; border-right: 1px solid #111; border-bottom: 1px solid #111; padding: 4px 6px; font-size: 8.7px; color: #444; }
    .section-title { margin: 0 0 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; font-size: 12px; }
    .annexure-meta { font-size: 9.5px; margin-bottom: 8px; color: #333; }
    .annexure { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #111; }
    .annexure th, .annexure td { border: 1px solid #111; padding: 5px 6px; font-size: 9.6px; }
    .annexure th { background: #f7f7f7; text-transform: uppercase; font-size: 8.6px; letter-spacing: 0.3px; }
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
          <div class="line-item"><strong>Name:</strong> ${escapeHtml(clientObj?.client_name || "-")}</div>
          <div class="line-item"><strong>Address:</strong> ${escapeHtml(clientObj?.office_address || "-")}</div>
          <div class="line-item"><strong>State:</strong> ${escapeHtml((clientObj as any)?.gstin_details?.state_name || "-")}</div>
          <div class="line-item"><strong>GSTIN:</strong> ${escapeHtml(clientObj?.gstin || "-")}</div>
        </div>
        <div class="cell receiver-right">
          <div class="line-item"><strong>State Code:</strong> ${escapeHtml(clientObj?.gstin?.slice(0, 2) || "-")}</div>
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
        <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>
    <div class="bottom-wrap">
      <div class="amount-words">
        <div class="label">Rupees in words</div>
        <div style="margin-top:4px;">Total Invoice Amount: ₹ ${money(grandTotal)} only</div>
      </div>
      <div class="totals-box">
        <div class="tot-line"><span>Freight + Misc</span><span>${money(grossSubtotal)}</span></div>
        <div class="tot-line"><span>Advance (-)</span><span>${money(advanceSubtotal)}</span></div>
        <div class="tot-line"><span>Subtotal</span><span>${money(invoiceSubtotal)}</span></div>
        ${taxPercentage > 0 ? (
          invoice.tax_type === "cgst_sgst"
            ? `<div class="tot-line"><span>CGST @ ${taxPercentage / 2}%</span><span>${money(tax / 2)}</span></div><div class="tot-line"><span>SGST @ ${taxPercentage / 2}%</span><span>${money(tax / 2)}</span></div>`
            : `<div class="tot-line"><span>IGST @ ${taxPercentage}%</span><span>${money(tax)}</span></div>`
        ) : `<div class="tot-line"><span>Tax</span><span>0.00</span></div>`}
        <div class="tot-line grand"><span>G. TOTAL</span><span>${money(grandTotal)}</span></div>
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
      <div class="decl-right"><div class="label right">For ${escapeHtml(partyName)}</div><div class="sign">Authorised Signatory</div></div>
    </div>
    <div class="small-note">Generated on ${escapeHtml(today)}</div>
  </div>
  <div class="page page-break">
    <h2 class="section-title">Annexure - Trip Details</h2>
    <div class="annexure-meta">Invoice No: ${escapeHtml(invoice.invoice_number || "-")} | Client: ${escapeHtml(clientObj?.client_name || "-")}</div>
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
          <th style="width:11%" class="right">Advance</th>
          <th style="width:11%" class="right">Net</th>
        </tr>
      </thead>
      <tbody>
        ${annexureRows || `<tr><td colspan="10" class="center">No trips found</td></tr>`}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  };

  const buildBiltyHtml = (doc: any) => {
    const partyName = user?.company_name || user?.name || "TRUCKSARTHI";
    const partyGstin = user?.gstin || (user as any)?.kyc_data?.gstin_details?.gstin || "-";
    const partyAddress = user?.address || (user as any)?.kyc_data?.gstin_details?.principal_place_address || "-";
    const partyPhone = user?.phone ? formatPhoneNumber(user.phone) : "-";
    const lrNo = doc?.bilty_number || String(doc?._id || "-").slice(-8).toUpperCase();
    const lrDate = formatDate(doc?.bilty_date || doc?.createdAt || new Date());
    const vehicleNo = doc?.vehicle_number || getTruckReg(trip.truck) || "-";
    const fromCity = getLocationName(trip.start_location) || "-";
    const toCity = getLocationName(trip.end_location) || "-";
    const goodsDescription = doc?.goods_description || trip?.notes || "Transport goods";
    const packages = Number(doc?.total_packages || 0);
    const totalWeight = Number(doc?.total_weight || 0);
    const charges = Number(doc?.charges || trip.cost_of_trip || 0);

    const money = (value: number) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

    const buildCopyPage = (copyLabel: string) => `
      <div class="page">
        <div class="copy-pill">${escapeHtml(copyLabel)}</div>
        <div class="sheet">
          <div class="header">
            <div class="logo-box">TS</div>
            <div class="company-center">
              <div class="brand">${escapeHtml(partyName)}</div>
              <div class="sub">${escapeHtml(partyAddress)}</div>
            </div>
            <div class="company-right">
              <div><strong>Phone:</strong> ${escapeHtml(partyPhone)}</div>
              <div><strong>GSTIN:</strong> ${escapeHtml(partyGstin)}</div>
            </div>
          </div>

          <div class="top-grid">
            <div class="box">
              <div class="box-title">Freight Paid By</div>
              <div>Consignor: <strong>Yes</strong></div>
              <div style="margin-top:12px;"><strong>Vehicle:</strong> ${escapeHtml(vehicleNo)}</div>
            </div>
            <div class="box">
              <div class="box-title">Insurance</div>
              <div>The consignor has not insured the consignment.</div>
            </div>
            <div class="box">
              <div class="box-title">Delivery / LR Details</div>
              <div><strong>LR No:</strong> ${escapeHtml(lrNo)}</div>
              <div><strong>Date:</strong> ${escapeHtml(lrDate)}</div>
            </div>
          </div>

          <div class="party-row">
            <div class="party-block">
              <div class="line-title">Consignor's Name & Address</div>
              <div>${escapeHtml(doc?.consignor?.name || "-")}</div>
              <div class="muted">${escapeHtml(doc?.consignor?.address || "-")}</div>
              <div class="muted">${escapeHtml(doc?.consignor?.gstin ? `GST: ${doc.consignor.gstin}` : "")}</div>
            </div>
            <div class="party-block">
              <div class="line-title">Consignee's Name & Address</div>
              <div>${escapeHtml(doc?.consignee?.name || "-")}</div>
              <div class="muted">${escapeHtml(doc?.consignee?.address || "-")}</div>
              <div class="muted">${escapeHtml(doc?.consignee?.gstin ? `GST: ${doc.consignee.gstin}` : "")}</div>
            </div>
          </div>

          <div class="route-box">
            <div><strong>From:</strong> ${escapeHtml(fromCity)}</div>
            <div><strong>To:</strong> ${escapeHtml(toCity)}</div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>Sr No.</th>
                <th>No. of Packets</th>
                <th>Description</th>
                <th>Actual Weight</th>
                <th>Unit</th>
                <th>Freight Amt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center">1</td>
                <td class="center">${packages || "-"}</td>
                <td>${escapeHtml(goodsDescription)}</td>
                <td class="center">${totalWeight || "-"}</td>
                <td class="center">Tonnes</td>
                <td class="right">${money(charges)}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-line"><strong>Amount in words:</strong> Rupees ${money(charges)} only</div>
          <div class="warning">Company is not responsible for leakages & thefts</div>

          <div class="footer-grid">
            <div class="terms">
              <div class="line-title">Terms & Conditions</div>
              <div>1. This is a digitally generated Bilty/LR copy.</div>
            </div>
            <div class="signature">
              <div>Certified that the particulars given above are true and correct.</div>
              <div style="margin-top:20px;"><strong>For, ${escapeHtml(partyName)}</strong></div>
              <div class="sign-line">Signature</div>
            </div>
          </div>
        </div>
      </div>
    `;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 8mm; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111; font-size: 10px; background: #fff; }
    .page { width: 100%; }
    .page-break { page-break-before: always; }
    .copy-pill { display: inline-block; border: 1px solid #333; border-radius: 999px; padding: 4px 10px; font-weight: 700; margin: 4px 0 8px; }
    .sheet { border: 2px solid #111; padding: 10px; }
    .header { display: grid; grid-template-columns: 60px 1fr 220px; gap: 10px; align-items: center; border-bottom: 1px solid #111; padding-bottom: 8px; }
    .logo-box { width: 52px; height: 52px; border: 1px solid #111; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .company-center { text-align: center; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
    .sub { font-size: 9px; color: #333; margin-top: 4px; }
    .company-right { font-size: 9px; line-height: 1.4; }
    .top-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 8px; }
    .box { border: 1px solid #111; border-radius: 6px; padding: 8px; min-height: 56px; }
    .box-title { font-weight: 700; margin-bottom: 6px; }
    .party-row { margin-top: 10px; border-top: 1px solid #111; border-bottom: 1px solid #111; }
    .party-block { padding: 6px 2px; border-bottom: 1px solid #999; }
    .party-block:last-child { border-bottom: 0; }
    .line-title { font-weight: 700; margin-bottom: 4px; }
    .muted { color: #333; margin-top: 2px; }
    .route-box { margin-top: 8px; border: 1px solid #111; border-radius: 6px; padding: 6px 8px; display: flex; gap: 22px; }
    .items { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
    .items th, .items td { border: 1px solid #111; padding: 5px 4px; font-size: 9px; }
    .items th { background: #f5f5f5; }
    .center { text-align: center; }
    .right { text-align: right; }
    .amount-line { margin-top: 8px; text-align: center; }
    .warning { margin-top: 8px; border: 1px solid #111; border-radius: 6px; padding: 8px; text-align: center; }
    .footer-grid { margin-top: 10px; display: grid; grid-template-columns: 2fr 1fr; border: 1px solid #111; }
    .terms { padding: 8px; min-height: 82px; border-right: 1px solid #111; }
    .signature { padding: 8px; min-height: 82px; position: relative; }
    .sign-line { position: absolute; right: 8px; bottom: 8px; }
  </style>
</head>
<body>
  ${buildCopyPage("Consignor LR")}
  <div class="page-break"></div>
  ${buildCopyPage("Consignee LR")}
</body>
</html>`;
  };

  const openInvoicePdf = async (invoice: any) => {
    const html = buildInvoiceHtml(invoice);
    const { uri } = await Print.printToFileAsync({ html });
    const safeId = String(invoice?.invoice_number || invoice?._id || "Invoice").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileUri = uri;
    router.push({
      pathname: "/(stack)/pdf-viewer",
      params: { uri: fileUri, title: `Invoice #${invoice?.invoice_number || safeId || "-"}` },
    } as any);
  };

  const openBiltyPdf = async (doc: any) => {
    const html = buildBiltyHtml(doc);
    const { uri } = await Print.printToFileAsync({ html });
    router.push({
      pathname: "/(stack)/pdf-viewer",
      params: { uri, title: "LR Preview" },
    } as any);
  };

  const findInvoiceForTrip = (invoiceList: any[], tripIdValue: string) => {
    const targetId = String(tripIdValue || "");
    return (invoiceList || []).find((inv) => (inv?.items || []).some((it: any) => String(getId(it?.trip)) === targetId));
  };

  const ensureInvoiceLoaded = async () => {
    if (invoice?._id) return invoice;
    const list = await fetchInvoices();
    const match = findInvoiceForTrip(list as any, String(trip._id));
    if (!match?._id) {
      throw new Error("Invoice not found");
    }
    const full = await getInvoiceById(String(match._id));
    setInvoice(full);
    return full;
  };

  const handlePreviewInvoice = async () => {
    try {
      setInvoiceBusy(true);
      const full = await ensureInvoiceLoaded();
      await openInvoicePdf(full);
    } catch (err: any) {
      const message = err?.message === "Invoice not found"
        ? "This trip is billed but no invoice was found."
        : (err?.response?.data?.error || "Failed to preview invoice.");
      Alert.alert("Error", message);
    } finally {
      setInvoiceBusy(false);
    }
  };

  const handleGenerateInvoice = async () => {
    const clientId = getId(trip.client);
    if (!clientId) {
      Alert.alert("Error", "Client not found for this trip.");
      return;
    }

    try {
      setInvoiceBusy(true);
      const effectiveTaxType = invoiceTaxType;
      const effectiveTaxPercentage: 0 | 5 | 18 = effectiveTaxType === "none" ? 0 : invoiceTaxPercentage;
      const payload = {
        due_date: invoiceDueDate.toISOString().split("T")[0],
        tax_type: effectiveTaxType,
        tax_percentage: effectiveTaxPercentage,
      };

      let targetInvoiceId = invoice?._id;
      if (invoiceEditMode && invoice?._id) {
        const updated = await updateInvoice(String(invoice._id), payload);
        targetInvoiceId = updated?._id || invoice?._id;
      } else {
        const created = await createInvoice({
          client_id: clientId,
          tripIds: [String(trip._id)],
          ...payload,
        });
        targetInvoiceId = created?._id || created?.invoice?._id;
        setTrip((prev) => (prev ? { ...prev, invoiced_status: "invoiced" } : prev));
      }

      setShowInvoiceSheet(false);
      setInvoiceEditMode(false);
      await reloadTrip();
      if (targetInvoiceId) {
        const full = await getInvoiceById(String(targetInvoiceId));
        setInvoice(full);
        await openInvoicePdf(full);
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.error || (invoiceEditMode ? "Failed to update invoice." : "Failed to generate invoice.")
      );
    } finally {
      setInvoiceBusy(false);
    }
  };

  const handleEditInvoice = async () => {
    try {
      setInvoiceBusy(true);
      const loadedInvoice = await ensureInvoiceLoaded();
      const taxType = loadedInvoice.tax_type === "igst" || loadedInvoice.tax_type === "cgst_sgst" ? loadedInvoice.tax_type : "none";
      const taxPercentage = [0, 5, 18].includes(Number(loadedInvoice.tax_percentage))
        ? (Number(loadedInvoice.tax_percentage) as 0 | 5 | 18)
        : 0;
      const parsedDueDate = loadedInvoice.due_date ? new Date(loadedInvoice.due_date) : new Date();

      setInvoiceTaxType(taxType);
      setInvoiceTaxPercentage(taxPercentage);
      setInvoiceDueDate(Number.isNaN(parsedDueDate.getTime()) ? new Date() : parsedDueDate);
      setInvoiceEditMode(true);
      setShowInvoiceSheet(true);
    } catch {
      Alert.alert("Invoice not found", "Could not load invoice details for editing.");
    } finally {
      setInvoiceBusy(false);
    }
  };

  const handleDeleteInvoice = async () => {
    let invoiceToDelete = invoice;
    if (!invoiceToDelete?._id) {
      try {
        invoiceToDelete = await ensureInvoiceLoaded();
      } catch {
        Alert.alert("Error", "Invoice not found.");
        return;
      }
    }

    Alert.alert("Delete Invoice", "Are you sure you want to delete this invoice?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setInvoiceBusy(true);
            await deleteInvoice(invoiceToDelete._id);
            setInvoice(null);
            setTrip((prev) => (prev ? { ...prev, invoiced_status: "not_invoiced" as any } : prev));
            await reloadTrip();
            Alert.alert("Success", "Invoice deleted successfully.");
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.error || "Failed to delete invoice.");
          } finally {
            setInvoiceBusy(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleBiltySubmit = async () => {
    if (!trip._id) {
      Alert.alert("Error", "Trip not found.");
      return;
    }

    try {
      setBiltyBusy(true);
      const createdBilty = await createBilty({
        trip: String(trip._id),
        consignor: biltyFormData.consignor,
        consignee: biltyFormData.consignee,
        goods_rows: [
          {
            sr_no: 1,
            description: biltyFormData.goods_description,
            quantity: Number(biltyFormData.total_packages || 0),
            unit: "Nos",
            actual_weight: Number(biltyFormData.total_weight || 0),
            rate: Number(biltyFormData.charges || 0),
            total: Number(biltyFormData.charges || 0),
          },
        ],
        charges: {
          freight: Number(biltyFormData.charges || 0),
          loading: 0,
          unloading: 0,
          other: 0,
          total: Number(biltyFormData.charges || 0),
          advance: 0,
          balance: Number(biltyFormData.charges || 0),
        },
        notes: biltyFormData.notes,
      });

      setBilty(createdBilty);
      setShowBiltySheet(false);
      await openBiltyPdf(createdBilty);

      // Reset form
      setBiltyFormData({
        consignor: {},
        consignee: {},
      });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to generate bilty.");
    } finally {
      setBiltyBusy(false);
    }
  };

  const handleDeleteBilty = async () => {
    if (!bilty?._id) {
      Alert.alert("Error", "Bilty not found.");
      return;
    }

    Alert.alert("Delete Bilty", "Are you sure you want to delete this bilty?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setBiltyBusy(true);
            await deleteBilty(bilty._id);
            setBilty(null);
            Alert.alert("Success", "Bilty deleted successfully.");
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.error || "Failed to delete bilty.");
          } finally {
            setBiltyBusy(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handlePreviewBilty = async () => {
    if (!bilty) {
      Alert.alert("Bilty not found", "Please generate bilty first.");
      return;
    }

    try {
      setBiltyBusy(true);
      await openBiltyPdf(bilty);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to preview bilty.");
    } finally {
      setBiltyBusy(false);
    }
  };

  const handleDeleteTrip = async () => {
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/api/trips/${trip._id}`);
            Alert.alert("Success", "Trip deleted successfully.");
            router.back();
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.error || "Failed to delete trip.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="mb-4">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Trip Detail</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
            {trip.public_id ? `${trip.public_id} â€¢ ` : ""}{trip.trip_date ? formatDate(trip.trip_date) : "No date"}
          </Text>
        </View>

        <View className="border rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Total</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}> ₹ {totalCost.toLocaleString()}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
            {getLocationName(trip.start_location)}
            {" -> "}
            {getLocationName(trip.end_location)}
          </Text>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, marginBottom: 4, fontSize: 12 }}>Client: {getClientName(trip.client)}</Text>
            <Text style={{ color: colors.foreground, marginBottom: 4, fontSize: 12 }}>Truck: {getTruckReg(trip.truck)}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>Driver: {getDriverName(trip.driver)}</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, opacity: 0.6, marginVertical: 8 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Trip Cost: ₹ {freightAmount.toLocaleString()}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Misc: ₹ {miscAmount.toLocaleString()}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Advance: ₹ {advanceAmount.toLocaleString()}</Text>
          </View>
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12, marginTop: 8 }}>
            Net Amount: ₹ {netTripAmount.toLocaleString()}
          </Text>
          {trip.notes ? (
            <Text style={{ fontStyle: "italic", color: colors.mutedForeground, fontSize: 11, marginTop: 8 }}>
              Notes: {trip.notes}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => setShowEditTripModal(true)}
              style={{ padding: 6, marginRight: 4 }}
            >
              <Edit3 size={18} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleDeleteTrip()}
              style={{ padding: 6 }}
            >
              <Trash2 size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* INVOICE MANAGEMENT SECTION */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>Invoice Management</Text>
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {/* Generate/Preview Invoice Button */}
            <TouchableOpacity
              onPress={() => {
                if (isBilled) {
                  void handlePreviewInvoice();
                }
                else {
                  setInvoiceEditMode(false);
                  setShowInvoiceSheet(true);
                }
              }}
              disabled={invoiceBusy}
              style={{
                width: "75%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isBilled ? colors.successSoft : colors.infoSoft,
                opacity: invoiceBusy ? 0.8 : 1,
              }}
            >
              <Ionicons
                name={isBilled ? "eye-outline" : "document-text-outline"}
                size={18}
                color={isBilled ? colors.success : colors.info}
              />
              <Text style={{ marginLeft: 8, fontWeight: "700", color: isBilled ? colors.success : colors.info, fontSize: 14 }}>
                {invoiceBusy ? (isBilled ? "Opening..." : "Generating...") : (isBilled ? "Preview Invoice" : "Generate Invoice")}
              </Text>
            </TouchableOpacity>

            <View style={{ width: "23%", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
              <TouchableOpacity
                onPress={() => void handleEditInvoice()}
                disabled={invoiceBusy || !isBilled}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.info,
                  backgroundColor: colors.infoSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: invoiceBusy || !isBilled ? 0.45 : 1,
                }}
              >
                <Edit3 size={18} color={colors.info} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleDeleteInvoice()}
                disabled={invoiceBusy || !isBilled}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.destructive,
                  backgroundColor: colors.destructive + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: invoiceBusy || !isBilled ? 0.45 : 1,
                }}
              >
                <Trash2 size={18} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BILTY SECTION */}
        <View className="mb-6">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Bilty / Bill of Lading</Text>
            {bilty && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.success + "20" }}>
                <Text style={{ color: colors.success, fontSize: 11, fontWeight: "700" }}>Generated</Text>
              </View>
            )}
          </View>

          {bilty ? (
            <View style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={handlePreviewBilty}
                  disabled={biltyBusy}
                  style={{
                    width: "75%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.successSoft,
                    opacity: biltyBusy ? 0.8 : 1,
                  }}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.success} />
                  <Text style={{ marginLeft: 8, fontWeight: "700", color: colors.success, fontSize: 14 }}>
                    Preview LR
                  </Text>
                </TouchableOpacity>

                <View style={{ width: "23%", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(stack)/bilty-wizard",
                        params: { tripId: String(trip._id), biltyId: String(bilty._id) },
                      } as any)
                    }
                    disabled={biltyBusy}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.info,
                      backgroundColor: colors.infoSoft,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: biltyBusy ? 0.45 : 1,
                    }}
                  >
                    <Edit3 size={18} color={colors.info} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteBilty}
                    disabled={biltyBusy}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.destructive,
                      backgroundColor: colors.destructive + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: biltyBusy ? 0.45 : 1,
                    }}
                  >
                    <Trash2 size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(stack)/bilty-wizard",
                  params: { tripId: String(trip._id) },
                } as any)
              }
              disabled={biltyBusy}
              style={{
                width: "75%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primarySoft,
                opacity: biltyBusy ? 0.8 : 1,
              }}
            >
              <Ionicons
                name="add-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={{ marginLeft: 8, fontWeight: "700", color: colors.primary, fontSize: 14 }}>
                {biltyBusy ? "Generating..." : "Generate Bilty"}
              </Text>
            </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>

        {history.length > 0 ? (
          <>
            <View className="mb-2">
              <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Edited History</Text>
            </View>

            {history.map((entry, idx) => {
              const snap = (entry.snapshot || {}) as any;
              const snapTotal = Number(snap.cost_of_trip || 0) + Number(snap.miscellaneous_expense || 0);
              return (
                <View
                  key={`history-${idx}`}
                  className="border rounded-2xl p-4 mb-3"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Edited on</Text>
                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>
                      {entry.edited_at ? formatDate(entry.edited_at) : "-"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
                    {getLocationName(snap.start_location)}
                    {" -> "}
                    {getLocationName(snap.end_location)}
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>Client: {getClientName(snap.client)}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>Truck: {getTruckReg(snap.truck)}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 6 }}>Driver: {getDriverName(snap.driver)}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Trip Cost: ₹ {Number(snap.cost_of_trip || 0).toLocaleString()}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Misc: ₹ {Number(snap.miscellaneous_expense || 0).toLocaleString()}</Text>
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12, marginTop: 6 }}>Total: ₹ {snapTotal.toLocaleString()}</Text>
                  {snap.notes ? (
                    <Text style={{ fontStyle: "italic", color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>
                      Notes: {snap.notes}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      <BottomSheet
        visible={showInvoiceSheet}
        onClose={() => {
          setShowInvoiceSheet(false);
          setInvoiceEditMode(false);
        }}
        title={invoiceEditMode ? "Edit Invoice" : "Generate Invoice"}
        subtitle={invoiceEditMode ? "Update tax and due date" : "Choose tax options"}
        maxHeight="70%"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={{ gap: 14, paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: colors.mutedForeground, fontWeight: "800", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
            Due Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowInvoiceDueDatePicker(true)}
            style={{
              paddingHorizontal: 14,
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.input,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{formatDate(invoiceDueDate)}</Text>
          </TouchableOpacity>
          {showInvoiceDueDatePicker && (
            <DateTimePicker value={invoiceDueDate} mode="date" display="default" onChange={onInvoiceDueDateChange} />
          )}

          <Text style={{ color: colors.mutedForeground, fontWeight: "800", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 6 }}>
            Tax Type
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              { id: "none", label: "None" },
              { id: "igst", label: "IGST" },
              { id: "cgst_sgst", label: "CGST+SGST" },
            ].map((opt) => {
              const active = invoiceTaxType === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => {
                    setInvoiceTaxType(opt.id as any);
                    if (opt.id === "none") setInvoiceTaxPercentage(0);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    height: 40,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.secondary + "10"),
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontWeight: "800" }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ color: colors.mutedForeground, fontWeight: "800", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 6 }}>
            Tax Percentage
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {([0, 5, 18] as const).map((p) => {
              const disabled = invoiceTaxType === "none" && p !== 0;
              const active = invoiceTaxPercentage === p;
              return (
                <TouchableOpacity
                  key={`tax-${p}`}
                  disabled={disabled}
                  onPress={() => setInvoiceTaxPercentage(p)}
                  style={{
                    paddingHorizontal: 14,
                    height: 40,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.secondary + "10"),
                    justifyContent: "center",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontWeight: "800" }}>
                    {p}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleGenerateInvoice}
            disabled={invoiceBusy}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center",
              opacity: invoiceBusy ? 0.75 : 1,
              marginTop: 12,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 15 }}>
              {invoiceBusy
                ? (invoiceEditMode ? "Updating..." : "Generating...")
                : (invoiceEditMode ? "Update & Preview" : "Generate & Preview")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      <BiltyModal
        visible={showBiltySheet}
        editing={!!bilty}
        formData={biltyFormData}
        setFormData={setBiltyFormData}
        onSubmit={handleBiltySubmit}
        onClose={() => setShowBiltySheet(false)}
        loading={biltyBusy}
      />

      <EditTripModal
        visible={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        trip={trip as any}
        trucks={trucks}
        drivers={drivers}
        clients={clients}
        locations={locations}
        onSave={async (id, data) => {
          await API.put(`/api/trips/${id}`, data);
          setShowEditTripModal(false);
          await reloadTrip();
        }}
        onDelete={async () => {
          setShowEditTripModal(false);
          await handleDeleteTrip();
        }}
      />
    </View>
  );
}
