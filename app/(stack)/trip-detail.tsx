import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { cacheDirectory, documentDirectory, moveAsync } from "expo-file-system";
import * as Sharing from "expo-sharing";

import API from "../api/axiosInstance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useDrivers from "../../hooks/useDriver";
import useClients from "../../hooks/useClient";
import useTrucks from "../../hooks/useTruck";
import useLocations from "../../hooks/useLocation";
import { formatDate } from "../../lib/utils";
import type { Trip, TripEditHistoryEntry } from "../../types/entity";

export default function TripDetail() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";

  const { drivers, fetchDrivers } = useDrivers();
  const { clients, fetchClients } = useClients();
  const { trucks, fetchTrucks } = useTrucks();
  const { locations, fetchLocations } = useLocations();

  const [loading, setLoading] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  const downloadTripPDF = async () => {
    if (!trip || downloading) return;

    try {
      setDownloading(true);
      const route = `${getLocationName(trip.start_location)} -> ${getLocationName(trip.end_location)}`;
      const title = trip.public_id ? `Trip ${trip.public_id}` : "Trip Detail";
      const dateLabel = trip.trip_date ? formatDate(trip.trip_date) : "-";

      const html = `
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 30px; color: #000; }
    .title { text-align: center; font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 12px; opacity: 0.75; margin-bottom: 16px; }
    .card { border: 1px solid #000; border-radius: 10px; padding: 14px; margin-top: 14px; }
    .row { display: flex; justify-content: space-between; gap: 12px; }
    .label { font-size: 11px; opacity: 0.6; margin-bottom: 4px; }
    .value { font-size: 13px; font-weight: 700; }
    .route { font-size: 15px; font-weight: 800; margin: 8px 0 10px 0; }
    .total { font-size: 18px; font-weight: 900; }
    .notes { margin-top: 10px; font-size: 13px; font-style: italic; opacity: 0.85; }
    .divider { height: 1px; background: #000; opacity: 0.2; margin: 12px 0; }
  </style>
</head>
<body>
  <div class="title">${title}</div>
  <div class="subtitle">${dateLabel}</div>
  <div class="card">
    <div class="row">
      <div>
        <div class="label">TOTAL</div>
        <div class="total">Rs ${totalCost.toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        <div class="label">TRIP ID</div>
        <div class="value">${trip.public_id || "-"}</div>
      </div>
    </div>
    <div class="route">${route}</div>
    <div class="row">
      <div style="flex:1">
        <div class="label">CLIENT</div>
        <div class="value">${getClientName(trip.client)}</div>
      </div>
      <div style="flex:1">
        <div class="label">TRUCK</div>
        <div class="value">${getTruckReg(trip.truck)}</div>
      </div>
      <div style="flex:1">
        <div class="label">DRIVER</div>
        <div class="value">${getDriverName(trip.driver)}</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="row">
      <div style="flex:1">
        <div class="label">TRIP COST</div>
        <div class="value">Rs ${Number(trip.cost_of_trip || 0).toLocaleString()}</div>
      </div>
      <div style="flex:1; text-align:right">
        <div class="label">MISC EXPENSE</div>
        <div class="value">Rs ${Number(trip.miscellaneous_expense || 0).toLocaleString()}</div>
      </div>
    </div>
    ${trip.notes ? `<div class="notes">Notes: ${String(trip.notes)}</div>` : ""}
  </div>
</body>
</html>
`;

      const { uri } = await Print.printToFileAsync({ html });
      const safeId = String(trip.public_id || trip._id || "Trip").replace(/[^a-zA-Z0-9_-]/g, "");
      const baseDir = documentDirectory || cacheDirectory;
      const shareUri = baseDir ? `${baseDir}${safeId}.pdf` : uri;
      if (baseDir) {
        await moveAsync({ from: uri, to: shareUri });
      }
      await Sharing.shareAsync(shareUri);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setDownloading(false);
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
              onPress={downloadTripPDF}
              disabled={downloading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: colors.infoSoft,
                opacity: downloading ? 0.8 : 1,
              }}
            >
              <Ionicons name="download-outline" size={18} color={colors.info} />
              <Text style={{ marginLeft: 8, fontWeight: "700", color: colors.info }}>
                {downloading ? "Generating..." : "Download PDF"}
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
    </View>
  );
}
