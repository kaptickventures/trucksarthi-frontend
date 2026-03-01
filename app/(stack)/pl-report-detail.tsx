import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import useDrivers from "../../hooks/useDriver";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate } from "../../lib/utils";

type EntityType = "client" | "driver" | "truck";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

const toParamValue = (value?: string | string[]) => {
  if (!value) return "";
  return Array.isArray(value) ? value[0] || "" : value;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const entityConfig: Record<EntityType, { label: string; key: "clientId" | "driverId" | "truckId" }> = {
  client: { label: "Client", key: "clientId" },
  driver: { label: "Driver", key: "driverId" },
  truck: { label: "Truck", key: "truckId" },
};

export default function PLReportDetailScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const { entityType: rawType, entityId: rawId } = useLocalSearchParams<{
    entityType?: EntityType | EntityType[];
    entityId?: string | string[];
  }>();

  const entityType = toParamValue(rawType as any) as EntityType;
  const entityId = toParamValue(rawId);

  const { transactions, fetchTransactions, loading } = useFinance();
  const { clients, fetchClients } = useClients();
  const { drivers, fetchDrivers } = useDrivers();
  const { trucks, fetchTrucks } = useTrucks();

  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadData = useCallback(async () => {
    if (!entityType || !entityId) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchTransactions(), fetchClients(), fetchDrivers(), fetchTrucks()]);
    } finally {
      setRefreshing(false);
    }
  }, [entityId, entityType, fetchClients, fetchDrivers, fetchTransactions, fetchTrucks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const config = entityConfig[entityType];

  const entityName = useMemo(() => {
    if (!entityType || !entityId) return "Unknown";
    if (entityType === "client") {
      const found = (clients || []).find((item: any) => String(item._id) === entityId);
      return found?.client_name || "Unknown Client";
    }
    if (entityType === "driver") {
      const found = (drivers || []).find((item: any) => String(item._id) === entityId);
      return found?.driver_name || found?.name || "Unknown Driver";
    }
    const found = (trucks || []).find((item: any) => String(item._id) === entityId);
    return found?.registration_number || "Unknown Truck";
  }, [clients, drivers, entityId, entityType, trucks]);

  const filtered = useMemo(() => {
    if (!config || !entityId) return [];
    return (transactions || [])
      .filter((tx: any) => toRefId(tx[config.key]) === entityId)
      .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  }, [config, entityId, transactions]);

  const approved = useMemo(
    () => filtered.filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED"),
    [filtered]
  );

  const summary = useMemo(() => {
    const income = approved
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "INCOME")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    const expense = approved
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "EXPENSE")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    return {
      income,
      expense,
      net: income - expense,
      totalEntries: filtered.length,
      approvedEntries: approved.length,
    };
  }, [approved, filtered.length]);

  const handleDownload = async () => {
    if (!entityType || !entityId) return;

    setDownloading(true);
    try {
      const rowsHtml = filtered
        .map((tx: any, index: number) => {
          const txDate = formatDate(tx.date || tx.createdAt);
          const direction = String(tx.direction || "").toUpperCase();
          const amount = Number(tx.amount || 0);
          const signedAmount = `${direction === "INCOME" ? "+" : "-"}Rs ${Math.abs(amount).toLocaleString()}`;
          const status = String(tx.approvalStatus || "PENDING").toUpperCase();
          const category = String(tx.category || "-");
          const sourceModule = String(tx.sourceModule || "-");
          const notes = String(tx.notes || "-");

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(txDate)}</td>
              <td>${escapeHtml(category)}</td>
              <td>${escapeHtml(sourceModule)}</td>
              <td>${escapeHtml(status)}</td>
              <td class="${direction === "INCOME" ? "pos" : "neg"}">${escapeHtml(signedAmount)}</td>
              <td>${escapeHtml(notes)}</td>
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
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
    h1 { margin: 0; font-size: 22px; }
    .sub { margin-top: 4px; color: #6b7280; font-size: 12px; }
    .meta { margin-top: 12px; padding: 10px 12px; background: #f3f4f6; border-radius: 8px; font-size: 12px; }
    .cards { margin-top: 12px; display: flex; gap: 10px; }
    .card { flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .label { color: #6b7280; font-size: 11px; }
    .value { margin-top: 4px; font-size: 15px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
    th { background: #111827; color: white; text-align: left; padding: 8px; }
    td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    .pos { color: #15803d; font-weight: 700; }
    .neg { color: #b91c1c; font-weight: 700; }
    .footer { margin-top: 16px; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>P&L Detail Report</h1>
  <div class="sub">${escapeHtml(config?.label || "Entity")}: ${escapeHtml(entityName)}</div>
  <div class="meta">
    Generated on: ${escapeHtml(formatDate(new Date()))}<br/>
    Total Entries: ${summary.totalEntries} | Approved Entries: ${summary.approvedEntries}
  </div>
  <div class="cards">
    <div class="card">
      <div class="label">Approved Income</div>
      <div class="value">Rs ${summary.income.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Approved Expense</div>
      <div class="value">Rs ${summary.expense.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Net</div>
      <div class="value">${summary.net >= 0 ? "+" : "-"}Rs ${Math.abs(summary.net).toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Category</th>
        <th>Module</th>
        <th>Status</th>
        <th>Amount</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="7">No transactions found.</td></tr>`}
    </tbody>
  </table>

  <div class="footer">Generated by Trucksarthi P&L Reports</div>
</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const cleanName = entityName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32) || "report";
      const targetUri = `${FileSystem.documentDirectory}PL-${entityType}-${cleanName}-${Date.now()}.pdf`;

      await FileSystem.moveAsync({ from: uri, to: targetUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(targetUri);
      } else {
        Alert.alert("Report Ready", `Saved at: ${targetUri}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate report PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (!config || !entityId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.mutedForeground }}>Invalid report entity.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{config.label} P&L Detail</Text>
        <TouchableOpacity onPress={handleDownload} disabled={downloading}>
          <Download size={20} color={downloading ? colors.mutedForeground : colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{entityName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {summary.totalEntries} entries | {summary.approvedEntries} approved
          </Text>
          <Text style={{ color: summary.net >= 0 ? colors.success : colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 16 }}>
            Net: {summary.net >= 0 ? "+" : "-"}Rs {Math.abs(summary.net).toLocaleString()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <SummaryCard label="Income" value={summary.income} tone="green" />
          <SummaryCard label="Expense" value={summary.expense} tone="red" />
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {filtered.map((tx: any) => {
            const isIncome = String(tx.direction || "").toUpperCase() === "INCOME";
            const date = formatDate(tx.date || tx.createdAt);

            return (
              <View key={String(tx._id)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                      {String(tx.category || "GENERAL").replace(/_/g, " ")}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                      {String(tx.sourceModule || "-").replace(/_/g, " ")} | {String(tx.approvalStatus || "PENDING").toUpperCase()}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                      {date}
                    </Text>
                    {tx.notes ? (
                      <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                        {String(tx.notes)}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      {isIncome ? <ArrowDownLeft size={14} color="#16a34a" /> : <ArrowUpRight size={14} color="#dc2626" />}
                      <Text style={{ marginLeft: 4, color: isIncome ? "#16a34a" : "#dc2626", fontWeight: "800", fontSize: 11 }}>
                        {isIncome ? "INCOME" : "EXPENSE"}
                      </Text>
                    </View>
                    <Text style={{ color: isIncome ? colors.success : colors.destructive, fontWeight: "800" }}>
                      {isIncome ? "+" : "-"}Rs {Math.abs(Number(tx.amount || 0)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {!loading && filtered.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
              No transactions found for this {config.label.toLowerCase()}.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "green" | "red" }) {
  const { colors } = useThemeStore();
  const amountColor = tone === "green" ? colors.success : colors.destructive;

  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: amountColor, marginTop: 6, fontWeight: "800", fontSize: 14 }}>
        Rs {Number(value || 0).toLocaleString()}
      </Text>
    </View>
  );
}
