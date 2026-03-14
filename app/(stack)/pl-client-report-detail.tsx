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

import useClients from "../../hooks/useClient";
import { useClientLedger } from "../../hooks/useClientLedger";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function PLClientReportDetailScreen() {
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { clientId: rawClientId } = useLocalSearchParams<{ clientId?: string | string[] }>();
  const clientId = Array.isArray(rawClientId) ? rawClientId[0] : rawClientId || "";

  const { entries, fetchLedger, fetchSummary, loading } = useClientLedger();
  const { clients, fetchClients } = useClients();

  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState({ total_debits: 0, total_credits: 0, outstanding: 0 });

  const loadData = useCallback(async () => {
    if (!clientId) return;
    setRefreshing(true);
    try {
      const [sum] = await Promise.all([fetchSummary(clientId), fetchLedger(clientId), fetchClients()]);
      if (sum) setSummary(sum);
    } catch {
      // no-op
    } finally {
      setRefreshing(false);
    }
  }, [clientId, fetchClients, fetchLedger, fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clientName = useMemo(() => {
    const found = (clients || []).find((item: any) => String(item._id) === clientId);
    return found?.client_name || "Unknown Client";
  }, [clients, clientId]);

  const normalizedEntries = useMemo(() => {
    return (entries || [])
      .map((item: any) => {
        const entryType = String(item.entry_type || item.type || "").toLowerCase();
        const isCredit = entryType === "credit" || entryType === "payment";
        const amount = Number(item.amount || 0);
        return {
          ...item,
          idLabel: String(item.invoice || item.invoice_id || item._id || "-"),
          displayDate: formatDate(item.entry_date || item.date || item.createdAt),
          isCredit,
          amount,
        };
      })
      .sort((a: any, b: any) => {
        const aTime = new Date(a.entry_date || a.date || a.createdAt || 0).getTime();
        const bTime = new Date(b.entry_date || b.date || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [entries]);

  const handleDownload = async () => {
    if (!clientId) return;
    setDownloading(true);
    try {
      const rowsHtml = normalizedEntries
        .map((entry: any, index: number) => {
          const signed = `${entry.isCredit ? "+" : "-"}Rs ${Math.abs(entry.amount).toLocaleString()}`;
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(entry.displayDate)}</td>
            <td>${escapeHtml(entry.remarks || (entry.isCredit ? "Payment Received" : "Invoice Generated"))}</td>
            <td>${escapeHtml(entry.idLabel)}</td>
            <td>${escapeHtml((entry.payment_mode || "CASH").toUpperCase())}</td>
            <td class="${entry.isCredit ? "pos" : "neg"}">${escapeHtml(signed)}</td>
          </tr>`;
        })
        .join("");

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
          .pos { color: #15803d; font-weight: 700; }
          .neg { color: #b91c1c; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Client P&L Detail</h1>
        <div class="sub">Client: ${escapeHtml(clientName)}</div>
        <div class="sub">Generated on: ${escapeHtml(formatDate(new Date()))}</div>
        <div class="cards">
          <div class="card"><div class="label">Billed</div><div class="value">Rs ${summary.total_debits.toLocaleString()}</div></div>
          <div class="card"><div class="label">Settled</div><div class="value">Rs ${summary.total_credits.toLocaleString()}</div></div>
          <div class="card"><div class="label">Outstanding</div><div class="value">Rs ${summary.outstanding.toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Entry</th><th>Reference</th><th>Mode</th><th>Amount</th></tr></thead>
          <tbody>${rowsHtml || `<tr><td colspan="6">No entries found.</td></tr>`}</tbody>
        </table>
      </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const cleanName = clientName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32) || "client";
      const targetUri = `${FileSystem.documentDirectory}PL-client-${cleanName}-${Date.now()}.pdf`;
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

  if (!clientId) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.mutedForeground }}>Invalid client.</Text>
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
              {t("clientPL")}
            </Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
              {clientName}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDownload} disabled={downloading} style={{ paddingTop: 2 }}>
            <Download size={22} color={downloading ? colors.mutedForeground : colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: summary.outstanding > 0 ? colors.destructive : colors.success, fontWeight: "800", fontSize: 16 }}>
            Outstanding: Rs {summary.outstanding.toLocaleString()}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {normalizedEntries.length} entries
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{(t("billed") || "Billed").toUpperCase()}</Text>
            <Text style={{ color: colors.foreground, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {summary.total_debits.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{(t("settled") || "Settled").toUpperCase()}</Text>
            <Text style={{ color: colors.success, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {summary.total_credits.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {normalizedEntries.map((item: any, idx: number) => (
            <View key={item._id || idx} style={{ borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: idx === 0 ? 0 : 10, marginTop: idx === 0 ? 0 : 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                    {item.remarks || (item.isCredit ? "Payment Received" : "Invoice Generated")}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                    {item.idLabel}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{item.displayDate}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    {item.isCredit ? <ArrowDownLeft size={14} color={colors.success} /> : <ArrowUpRight size={14} color={colors.destructive} />}
                    <Text style={{ marginLeft: 4, color: item.isCredit ? colors.success : colors.destructive, fontWeight: "800", fontSize: 11 }}>
                      {item.isCredit ? "CREDIT" : "DEBIT"}
                    </Text>
                  </View>
                  <Text style={{ color: item.isCredit ? colors.success : colors.destructive, fontWeight: "800" }}>
                    {item.isCredit ? "+" : "-"}Rs {Math.abs(item.amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {!loading && normalizedEntries.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>No khata entries found.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
