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
import useDrivers from "../../hooks/useDriver";
import useDriverFinance from "../../hooks/useDriverFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

type TabType = "ALL" | "TO_DRIVER" | "DRIVER_SPENDS";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function PLDriverReportDetailScreen() {
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { driverId: rawDriverId } = useLocalSearchParams<{ driverId?: string | string[] }>();
  const driverId = Array.isArray(rawDriverId) ? rawDriverId[0] : rawDriverId || "";

  const { entries, fetchDriverLedger, loading } = useDriverFinance();
  const { drivers, fetchDrivers } = useDrivers();

  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  const loadData = useCallback(async () => {
    if (!driverId) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchDriverLedger(driverId), fetchDrivers()]);
    } finally {
      setRefreshing(false);
    }
  }, [driverId, fetchDriverLedger, fetchDrivers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const driver = useMemo(() => (drivers || []).find((d: any) => String(d._id) === driverId), [drivers, driverId]);

  const normalized = useMemo(() => {
    return [...(entries || [])]
      .map((entry: any) => {
        const nature = String(entry.transaction_nature || "").toUpperCase();
        const direction = String(entry.direction || "").toUpperCase();
        const category = String(entry.category || entry.transactionSubtype || entry.title || "").toUpperCase();
        const isToDriver =
          nature === "RECEIVED_BY_DRIVER" ||
          direction === "TO" ||
          category.includes("OWNER_TO_DRIVER") ||
          category.includes("SALARY");
        const amount = Number(entry.amount || 0);
        return {
          ...entry,
          entryDate: entry.entry_date || entry.date || entry.createdAt,
          entryTitle: entry.remarks || (isToDriver ? "Advance To Driver" : "Driver Spend"),
          type: isToDriver ? "TO_DRIVER" : "DRIVER_SPENDS",
          amount,
        };
      })
      .sort((a: any, b: any) => new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime());
  }, [entries]);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return normalized;
    return normalized.filter((entry: any) => entry.type === activeTab);
  }, [activeTab, normalized]);

  const totals = useMemo(() => {
    const toDriver = normalized.filter((entry: any) => entry.type === "TO_DRIVER").reduce((sum: number, entry: any) => sum + entry.amount, 0);
    const driverSpends = normalized.filter((entry: any) => entry.type === "DRIVER_SPENDS").reduce((sum: number, entry: any) => sum + entry.amount, 0);
    return {
      toDriver,
      driverSpends,
      balance: toDriver - driverSpends,
    };
  }, [normalized]);

  const handleDownload = async () => {
    if (!driverId) return;
    setDownloading(true);
    try {
      const debitTotal = normalized
        .filter((entry: any) => entry.type === "TO_DRIVER")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const creditTotal = normalized
        .filter((entry: any) => entry.type === "DRIVER_SPENDS")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const difference = debitTotal - creditTotal;

      const rowsHtml = normalized
        .map((entry: any, index: number) => {
          const isDebit = entry.type === "TO_DRIVER";
          const debit = isDebit ? `Rs ${Number(entry.amount || 0).toLocaleString()}` : "";
          const credit = !isDebit ? `Rs ${Number(entry.amount || 0).toLocaleString()}` : "";
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatDate(entry.entryDate))}</td>
            <td>${escapeHtml(entry.type === "TO_DRIVER" ? "To Driver" : "Driver Spend")}</td>
            <td>${escapeHtml(entry.entryTitle || "-")}</td>
            <td class="debit">${escapeHtml(debit)}</td>
            <td class="credit">${escapeHtml(credit)}</td>
          </tr>`;
        })
        .join("");

      const totalsHtml = `
          <tr class="totals">
            <td colspan="4">Totals</td>
            <td class="debit">Rs ${debitTotal.toLocaleString()}</td>
            <td class="credit">Rs ${creditTotal.toLocaleString()}</td>
          </tr>
          <tr class="difference">
            <td colspan="4">Difference (Debit - Credit)</td>
            <td colspan="2" class="diff">${difference >= 0 ? "" : "-"}Rs ${Math.abs(difference).toLocaleString()}</td>
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
        <h1>Driver P&L Detail</h1>
        <div class="sub">Driver: ${escapeHtml(driver?.driver_name || driver?.name || "Driver")}</div>
        <div class="sub">Generated on: ${escapeHtml(formatDate(new Date()))}</div>
        <div class="cards">
          <div class="card"><div class="label">To Driver</div><div class="value">Rs ${totals.toDriver.toLocaleString()}</div></div>
          <div class="card"><div class="label">Driver Spends</div><div class="value">Rs ${totals.driverSpends.toLocaleString()}</div></div>
          <div class="card"><div class="label">Balance</div><div class="value">${totals.balance >= 0 ? "+" : "-"}Rs ${Math.abs(totals.balance).toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Type</th><th>Remarks</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${(rowsHtml || `<tr><td colspan="6">No entries found.</td></tr>`) + totalsHtml}</tbody>
        </table>
      </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const driverName = (driver?.driver_name || driver?.name || "driver").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32);
      const targetUri = `${FileSystem.documentDirectory}PL-driver-${driverName}-${Date.now()}.pdf`;
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

  if (!driverId) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.mutedForeground }}>Invalid driver.</Text>
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
              {t("driverPL")}
            </Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
              {driver?.driver_name || driver?.name || "Driver"}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDownload} disabled={downloading} style={{ paddingTop: 2 }}>
            <Download size={22} color={downloading ? colors.mutedForeground : colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: totals.balance >= 0 ? colors.success : colors.destructive, fontWeight: "800", fontSize: 16 }}>
            Net Balance: {totals.balance >= 0 ? "+" : "-"}Rs {Math.abs(totals.balance).toLocaleString()}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{normalized.length} entries</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>TO DRIVER</Text>
            <Text style={{ color: colors.success, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {totals.toDriver.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>DRIVER SPENDS</Text>
            <Text style={{ color: colors.destructive, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {totals.driverSpends.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {([
            { id: "ALL", label: "All" },
            { id: "TO_DRIVER", label: "To Driver" },
            { id: "DRIVER_SPENDS", label: "Driver Spends" },
          ] as { id: TabType; label: string }[]).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: activeTab === tab.id ? colors.primary : colors.border,
                backgroundColor: activeTab === tab.id ? colors.primary : "transparent",
                paddingVertical: 9,
                alignItems: "center",
              }}
            >
              <Text style={{ color: activeTab === tab.id ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {filtered.map((entry: any, idx: number) => {
            const isToDriver = entry.type === "TO_DRIVER";
            return (
              <View key={entry._id || idx} style={{ borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: idx === 0 ? 0 : 10, marginTop: idx === 0 ? 0 : 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>{entry.entryTitle}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{formatDate(entry.entryDate)}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      {isToDriver ? <ArrowDownLeft size={14} color={colors.success} /> : <ArrowUpRight size={14} color={colors.destructive} />}
                      <Text style={{ marginLeft: 4, color: isToDriver ? colors.success : colors.destructive, fontWeight: "800", fontSize: 11 }}>
                        {isToDriver ? "TO DRIVER" : "EXPENSE"}
                      </Text>
                    </View>
                    <Text style={{ color: isToDriver ? colors.success : colors.destructive, fontWeight: "800" }}>
                      {isToDriver ? "+" : "-"}Rs {Math.abs(entry.amount).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {!loading && filtered.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>No khata entries found.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
