import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { cacheDirectory, documentDirectory, moveAsync } from "expo-file-system";

import API from "../api/axiosInstance";
import BottomSheet from "../../components/BottomSheet";
import { useThemeStore } from "../../hooks/useThemeStore";
import useDrivers from "../../hooks/useDriver";
import useClients from "../../hooks/useClient";
import useTrucks from "../../hooks/useTruck";
import useLocations from "../../hooks/useLocation";
import { useInvoices } from "../../hooks/useInvoice";
import { formatDate } from "../../lib/utils";
import type { Trip, TripEditHistoryEntry } from "../../types/entity";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function TripDetail() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";

  const { drivers, fetchDrivers } = useDrivers();
  const { clients, fetchClients } = useClients();
  const { trucks, fetchTrucks } = useTrucks();
  const { locations, fetchLocations } = useLocations();
  const { fetchInvoices, getInvoiceById, createInvoice } = useInvoices();

  const [loading, setLoading] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);

  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const [invoiceTaxType, setInvoiceTaxType] = useState<"none" | "igst" | "cgst_sgst">("none");
  const [invoiceTaxPercentage, setInvoiceTaxPercentage] = useState<0 | 5 | 18>(0);
  const [invoiceBusy, setInvoiceBusy] = useState(false);

  useEffect(() => {
    fetchDrivers();
    fetchClients();
    fetchTrucks();
    fetchLocations();
  }, [fetchDrivers, fetchClients, fetchTrucks, fetchLocations]);

  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId) return;
      try {
        setLoading(true);
        const res = await API.get(`/api/trips/${tripId}`);
        setTrip(res.data);
      } catch {
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };
    loadTrip();
  }, [tripId]);

  const reloadTrip = async () => {
    if (!tripId) return;
    try {
      const res = await API.get(`/api/trips/${tripId}`);
      setTrip(res.data);
    } catch {
      // ignore
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

  const totalCost = Number(trip.cost_of_trip || 0) + Number(trip.miscellaneous_expense || 0);

  const isBilled = String(trip.invoiced_status || "") === "invoiced";

  const buildInvoiceHtml = (invoice: any) => {
    const route = `${getLocationName(trip.start_location)} -> ${getLocationName(trip.end_location)}`;
    const tripDate = trip.trip_date ? formatDate(trip.trip_date) : "-";
    const invoiceDate = invoice?.createdAt ? formatDate(invoice.createdAt) : formatDate(new Date());

    const subtotal = Number(invoice?.subtotal_amount ?? totalCost);
    const taxPercentage = Number(invoice?.tax_percentage ?? 0);
    const tax = Number(invoice?.tax_amount ?? ((subtotal * taxPercentage) / 100));
    const grandTotal = Number(invoice?.total_amount ?? (subtotal + tax));
    const taxLabel =
      invoice?.tax_type === "cgst_sgst"
        ? `CGST+SGST (${taxPercentage}%)`
        : invoice?.tax_type === "igst"
          ? `IGST (${taxPercentage}%)`
          : "No tax";

    const tripLabel = trip.public_id ? `Trip ${escapeHtml(String(trip.public_id))}` : "Trip";

    return `
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 26px; color: #000; }
    .title { text-align:center; font-size: 22px; font-weight: 900; margin-bottom: 4px; }
    .sub { text-align:center; font-size: 12px; opacity: 0.75; margin-bottom: 14px; }
    .card { border: 1px solid #000; border-radius: 10px; padding: 14px; }
    .row { display:flex; justify-content:space-between; gap: 12px; margin-bottom: 10px; }
    .label { font-size: 11px; opacity: 0.65; margin-bottom: 3px; }
    .value { font-size: 13px; font-weight: 700; }
    .route { font-size: 14px; font-weight: 800; margin: 8px 0 10px 0; }
    .divider { height: 1px; background: #000; opacity: 0.2; margin: 10px 0; }
    .total { font-size: 18px; font-weight: 900; }
    table { width:100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    td { padding: 8px 0; }
    td.right { text-align:right; }
  </style>
</head>
<body>
  <div class="title">Invoice</div>
  <div class="sub">Invoice #${escapeHtml(String(invoice?.invoice_number || "-"))} • ${escapeHtml(String(invoiceDate))}</div>
  <div class="card">
    <div class="row">
      <div style="flex:1">
        <div class="label">CLIENT</div>
        <div class="value">${escapeHtml(getClientName(trip.client))}</div>
      </div>
      <div style="text-align:right">
        <div class="label">${escapeHtml(tripLabel.toUpperCase())}</div>
        <div class="value">${escapeHtml(String(tripDate))}</div>
      </div>
    </div>
    <div class="route">${escapeHtml(route)}</div>
    <div class="row">
      <div style="flex:1">
        <div class="label">TRUCK</div>
        <div class="value">${escapeHtml(getTruckReg(trip.truck))}</div>
      </div>
      <div style="flex:1">
        <div class="label">DRIVER</div>
        <div class="value">${escapeHtml(getDriverName(trip.driver))}</div>
      </div>
    </div>
    <div class="divider"></div>
    <table>
      <tr>
        <td>Trip cost</td>
        <td class="right">Rs ${Number(trip.cost_of_trip || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Misc expense</td>
        <td class="right">Rs ${Number(trip.miscellaneous_expense || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td style="font-weight:800">Subtotal</td>
        <td class="right" style="font-weight:800">Rs ${Number(subtotal || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>${escapeHtml(taxLabel)}</td>
        <td class="right">Rs ${Number(tax || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td class="total">Total</td>
        <td class="right total">Rs ${Number(grandTotal || 0).toLocaleString()}</td>
      </tr>
    </table>
  </div>
</body>
</html>
`;
  };

  const openInvoicePdf = async (invoice: any) => {
    const html = buildInvoiceHtml(invoice);
    const { uri } = await Print.printToFileAsync({ html });
    const safeId = String(invoice?.invoice_number || invoice?._id || "Invoice").replace(/[^a-zA-Z0-9_-]/g, "");
    const baseDir = documentDirectory || cacheDirectory;
    const fileUri = baseDir ? `${baseDir}Invoice-${safeId}.pdf` : uri;
    if (baseDir) {
      await moveAsync({ from: uri, to: fileUri });
    }
    router.push({
      pathname: "/(stack)/pdf-viewer",
      params: { uri: fileUri, title: `Invoice #${invoice?.invoice_number || "-"}` },
    } as any);
  };

  const findInvoiceForTrip = (invoiceList: any[], tripIdValue: string) => {
    const targetId = String(tripIdValue || "");
    return (invoiceList || []).find((inv) => (inv?.items || []).some((it: any) => String(getId(it?.trip)) === targetId));
  };

  const handlePreviewInvoice = async () => {
    try {
      setInvoiceBusy(true);
      const list = await fetchInvoices();
      const match = findInvoiceForTrip(list as any, String(trip._id));
      if (!match?._id) {
        Alert.alert("Invoice not found", "This trip is billed but no invoice was found.");
        return;
      }
      const full = await getInvoiceById(String(match._id));
      await openInvoicePdf(full);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to preview invoice.");
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
      const created = await createInvoice({
        client_id: clientId,
        tripIds: [String(trip._id)],
        due_date: new Date().toISOString(),
        tax_type: effectiveTaxType,
        tax_percentage: effectiveTaxPercentage,
      });

      setShowInvoiceSheet(false);
      setTrip((prev) => (prev ? { ...prev, invoiced_status: "invoiced" } : prev));
      await reloadTrip();

      const createdId = created?._id || created?.invoice?._id;
      if (createdId) {
        const full = await getInvoiceById(String(createdId));
        await openInvoicePdf(full);
      } else {
        Alert.alert("Invoice created", "Invoice generated successfully.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to generate invoice.");
    } finally {
      setInvoiceBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="mb-4">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Trip Detail</Text>
            <TouchableOpacity
              onPress={() => {
                if (isBilled) handlePreviewInvoice();
                else setShowInvoiceSheet(true);
              }}
              disabled={invoiceBusy}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isBilled ? colors.successSoft : colors.infoSoft,
                opacity: invoiceBusy ? 0.8 : 1,
              }}
            >
              <Ionicons
                name={isBilled ? "eye-outline" : "document-text-outline"}
                size={18}
                color={isBilled ? colors.success : colors.info}
              />
              <Text style={{ marginLeft: 8, fontWeight: "700", color: isBilled ? colors.success : colors.info }}>
                {invoiceBusy ? (isBilled ? "Opening..." : "Generating...") : (isBilled ? "Preview Invoice" : "Generate Invoice")}
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
            {trip.public_id ? `${trip.public_id} • ` : ""}{trip.trip_date ? formatDate(trip.trip_date) : "No date"}
          </Text>
        </View>

        <View className="border rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Total</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>Rs {totalCost.toLocaleString()}</Text>
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
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Trip Cost: Rs {Number(trip.cost_of_trip).toLocaleString()}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Misc: Rs {Number(trip.miscellaneous_expense || 0).toLocaleString()}</Text>
          </View>
          {trip.notes ? (
            <Text style={{ fontStyle: "italic", color: colors.mutedForeground, fontSize: 11, marginTop: 8 }}>
              Notes: {trip.notes}
            </Text>
          ) : null}
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
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Trip Cost: Rs {Number(snap.cost_of_trip || 0).toLocaleString()}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Misc: Rs {Number(snap.miscellaneous_expense || 0).toLocaleString()}</Text>
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12, marginTop: 6 }}>Total: Rs {snapTotal.toLocaleString()}</Text>
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
        onClose={() => setShowInvoiceSheet(false)}
        title="Generate Invoice"
        subtitle="Choose tax options"
        maxHeight="60%"
      >
        <View style={{ gap: 14, paddingBottom: 10 }}>
          <Text style={{ color: colors.mutedForeground, fontWeight: "800", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
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
              {invoiceBusy ? "Generating..." : "Generate & Preview"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}
