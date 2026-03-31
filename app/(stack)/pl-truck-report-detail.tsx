import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowDownLeft, ArrowUpRight, Download } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "../../context/LanguageContext";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import useTrips from "../../hooks/useTrip";
import { formatDate } from "../../lib/utils";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function PLTruckReportDetailScreen() {
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { truckId: rawTruckId } = useLocalSearchParams<{ truckId?: string | string[] }>();
  const truckId = Array.isArray(rawTruckId) ? rawTruckId[0] : rawTruckId || "";

  const { transactions, fetchTransactions, loading: financeLoading } = useFinance();
  const { trucks, fetchTrucks } = useTrucks();
  const { trips, fetchTrips, loading: tripsLoading } = useTrips();

  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const loading = financeLoading || tripsLoading;

  const loadData = useCallback(async () => {
    if (!truckId) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchTransactions({ truckId }), fetchTrucks(), fetchTrips()]);
    } finally {
      setRefreshing(false);
    }
  }, [truckId, fetchTransactions, fetchTrucks, fetchTrips]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const truckName = useMemo(() => {
    const found = (trucks || []).find((item: any) => String(item._id) === truckId);
    return found?.registration_number || "Unknown Truck";
  }, [trucks, truckId]);

  const combinedEntries = useMemo(() => {
    const tripRows = (trips || [])
      .filter((trip: any) => toRefId(trip.truck) === truckId)
      .map((trip: any) => ({
        _id: `trip-${trip._id}`,
        date: trip.trip_date || trip.createdAt,
        title: "Trip Revenue",
        notes: `${trip.start_location?.location_name || "-"} to ${trip.end_location?.location_name || "-"}`,
        amount: Number(trip.cost_of_trip || 0),
        direction: "INCOME",
      }));

    const financeRows = (transactions || [])
      .filter((tx: any) => toRefId(tx.truckId) === truckId)
      .filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED")
      .map((tx: any) => ({
        _id: `fin-${tx._id}`,
        date: tx.date || tx.createdAt,
        title: String(tx.category || "GENERAL").replace(/_/g, " "),
        notes: tx.notes || String(tx.sourceModule || "").replace(/_/g, " "),
        amount: Number(tx.amount || 0),
        direction: String(tx.direction || "").toUpperCase() === "INCOME" ? "INCOME" : "EXPENSE",
      }));

    return [...tripRows, ...financeRows].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [transactions, trips, truckId]);

  const summary = useMemo(() => {
    const income = combinedEntries.filter((item) => item.direction === "INCOME").reduce((sum, item) => sum + item.amount, 0);
    const expense = combinedEntries.filter((item) => item.direction === "EXPENSE").reduce((sum, item) => sum + item.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [combinedEntries]);

  const handleDownload = async () => {
    if (!truckId) return;
    setDownloading(true);
    try {
      const debitTotal = combinedEntries
        .filter((item) => item.direction === "EXPENSE")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const creditTotal = combinedEntries
        .filter((item) => item.direction === "INCOME")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const difference = debitTotal - creditTotal;

      const rowsHtml = combinedEntries
        .map((item, index) => {
          const isDebit = item.direction === "EXPENSE";
          const debit = isDebit ? `₹ ${Number(item.amount || 0).toLocaleString()}` : "";
          const credit = !isDebit ? `₹ ${Number(item.amount || 0).toLocaleString()}` : "";
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatDate(item.date))}</td>
            <td>${escapeHtml(item.title)}</td>
            <td>${escapeHtml(item.notes || "-")}</td>
            <td class="debit">${escapeHtml(debit)}</td>
            <td class="credit">${escapeHtml(credit)}</td>
          </tr>`;
        })
        .join("");

      const totalsHtml = `
          <tr class="totals">
            <td colspan="4">Totals</td>
            <td class="debit">₹ ${debitTotal.toLocaleString()}</td>
            <td class="credit">₹ ${creditTotal.toLocaleString()}</td>
          </tr>
          <tr class="difference">
            <td colspan="4">Difference (Debit - Credit)</td>
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
        </style>
      </head>
      <body>
        <h1>Truck P&L Detail</h1>
        <div class="sub">Truck: ${escapeHtml(truckName)}</div>
        <div class="sub">Generated on: ${escapeHtml(formatDate(new Date()))}</div>
        <div class="cards">
          <div class="card"><div class="label">Income</div><div class="value">₹ ${summary.income.toLocaleString()}</div></div>
          <div class="card"><div class="label">Expense</div><div class="value">₹ ${summary.expense.toLocaleString()}</div></div>
          <div class="card"><div class="label">Net</div><div class="value">${summary.balance >= 0 ? "+" : "-"}₹ ${Math.abs(summary.balance).toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Entry</th><th>Notes</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${(rowsHtml || `<tr><td colspan="6">No entries found.</td></tr>`) + totalsHtml}</tbody>
        </table>
      </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const cleanName = truckName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32) || "truck";
      const targetUri = `${FileSystem.documentDirectory}PL-truck-${cleanName}-${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(targetUri);
      else Alert.alert("Report Ready", `Saved at: ${targetUri}`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate report PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (!truckId) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.mutedForeground }}>Invalid truck.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View className="mb-3" style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View>
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>
              {t("truckPL")}
            </Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
              {truckName}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDownload} disabled={downloading} style={{ paddingTop: 2 }}>
            <Download size={22} color={downloading ? colors.mutedForeground : colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: summary.balance >= 0 ? colors.success : colors.destructive, fontWeight: "800", fontSize: 16 }}>
            Net: {summary.balance >= 0 ? "+" : "-"}₹ {Math.abs(summary.balance).toLocaleString()}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{combinedEntries.length} entries</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{(t("income") || "Income").toUpperCase()}</Text>
            <Text style={{ color: colors.success, marginTop: 6, fontWeight: "800", fontSize: 14 }}> ₹ {summary.income.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{(t("expense") || "Expense").toUpperCase()}</Text>
            <Text style={{ color: colors.destructive, marginTop: 6, fontWeight: "800", fontSize: 14 }}> ₹ {summary.expense.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {combinedEntries.map((item, idx) => {
            const isIncome = item.direction === "INCOME";
            return (
              <View key={item._id || idx} style={{ borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: idx === 0 ? 0 : 10, marginTop: idx === 0 ? 0 : 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>{item.title}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{item.notes || "-"}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{formatDate(item.date)}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      {isIncome ? <ArrowDownLeft size={14} color={colors.success} /> : <ArrowUpRight size={14} color={colors.destructive} />}
                      <Text style={{ marginLeft: 4, color: isIncome ? colors.success : colors.destructive, fontWeight: "800", fontSize: 11 }}>
                        {isIncome ? "INCOME" : "EXPENSE"}
                      </Text>
                    </View>
                    <Text style={{ color: isIncome ? colors.success : colors.destructive, fontWeight: "800" }}>
                      {isIncome ? "+" : "-"}₹ {Math.abs(item.amount).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {!loading && combinedEntries.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>No data entries found for this truck.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
