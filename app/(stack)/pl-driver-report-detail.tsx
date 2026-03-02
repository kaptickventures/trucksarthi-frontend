import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowUpRight, Download } from "lucide-react-native";
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
import useDrivers from "../../hooks/useDriver";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

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

export default function PLDriverReportDetailScreen() {
    const router = useRouter();
    const { colors, theme } = useThemeStore();
    const { t } = useTranslation();
    const isDark = theme === "dark";

    const { entityId: rawId } = useLocalSearchParams<{
        entityId?: string | string[];
    }>();

    const entityId = toParamValue(rawId);

    const { transactions, fetchTransactions, loading } = useFinance();
    const { drivers, fetchDrivers } = useDrivers();

    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const loadData = useCallback(async () => {
        if (!entityId) return;
        setRefreshing(true);
        try {
            await Promise.all([fetchTransactions(), fetchDrivers()]);
        } finally {
            setRefreshing(false);
        }
    }, [entityId, fetchDrivers, fetchTransactions]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const entityName = useMemo(() => {
        if (!entityId) return "Unknown";
        const found = (drivers || []).find((item: any) => String(item._id) === entityId);
        return found?.driver_name || found?.name || "Unknown Driver";
    }, [drivers, entityId]);

    const filteredExpenses = useMemo(() => {
        if (!entityId) return [];
        const base = (transactions || [])
            .filter((tx: any) => toRefId(tx.driverId) === entityId && tx.direction === "EXPENSE")
            .map((tx: any) => {
                const category = String(tx.category || "").toUpperCase();
                const type = category === "OWNER_TO_DRIVER" ? "TO_DRIVER" : "DRIVER_SPENDS";
                return { ...tx, type };
            })
            // Sort ascending to calculate running balance
            .sort((a: any, b: any) => new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());

        let currentBalance = 0;
        const withBalance = base.map((tx: any) => {
            currentBalance += Number(tx.amount || 0);
            return { ...tx, runningBalance: currentBalance };
        });

        // Return descending for display
        return withBalance.reverse();
    }, [entityId, transactions]);

    const approved = useMemo(
        () => filteredExpenses.filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED"),
        [filteredExpenses]
    );

    const summary = useMemo(() => {
        const toDriver = approved
            .filter((tx: any) => tx.type === "TO_DRIVER")
            .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        const driverSpends = approved
            .filter((tx: any) => tx.type === "DRIVER_SPENDS")
            .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        return {
            toDriver,
            driverSpends,
            totalExpense: toDriver + driverSpends,
            totalEntries: filteredExpenses.length,
            approvedEntries: approved.length,
        };
    }, [approved, filteredExpenses.length]);

    const handleDownload = async () => {
        if (!entityId) return;

        setDownloading(true);
        try {
            const rowsHtml = filteredExpenses
                .map((tx: any, index: number) => {
                    const txDate = formatDate(tx.date || tx.createdAt);
                    const amount = Number(tx.amount || 0);
                    const signedAmount = `-Rs ${Math.abs(amount).toLocaleString()}`;
                    const status = String(tx.approvalStatus || "PENDING").toUpperCase();
                    const category = tx.type === "TO_DRIVER" ? "To Driver" : "Driver Spend";
                    const paymentMode = String(tx.paymentMode || "-");
                    const notes = String(tx.notes || "-");
                    const balanceAt = Number(tx.runningBalance || 0);

                    return `
            <tr>
              <td>${filteredExpenses.length - index}</td>
              <td>${escapeHtml(txDate)}</td>
              <td>${escapeHtml(category)}</td>
              <td>${escapeHtml(status)}</td>
              <td>${escapeHtml(paymentMode)}</td>
              <td class="neg">${escapeHtml(signedAmount)}<br/><span style="font-size: 8px; color: #6b7280;">Bal: Rs ${balanceAt.toLocaleString()}</span></td>
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
    .neg { color: #b91c1c; font-weight: 700; }
    .footer { margin-top: 16px; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>Driver P&L Detail Report (Expenses Only)</h1>
  <div class="sub">Driver: ${escapeHtml(entityName)}</div>
  <div class="meta">
    Generated on: ${escapeHtml(formatDate(new Date()))}<br/>
    Total Entries: ${summary.totalEntries} | Approved Entries: ${summary.approvedEntries}
  </div>
  <div class="cards">
    <div class="card">
      <div class="label">To Driver</div>
      <div class="value">Rs ${summary.toDriver.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Driver Spends</div>
      <div class="value">Rs ${summary.driverSpends.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Total Expense</div>
      <div class="value">Rs ${summary.totalExpense.toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Category</th>
        <th>Status</th>
        <th>Source</th>
        <th>Amount & Balance</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="7">No expense transactions found.</td></tr>`}
    </tbody>
  </table>

  <div class="footer">Generated by Trucksarthi P&L Reports</div>
</body>
</html>
      `;

            const { uri } = await Print.printToFileAsync({ html });
            const cleanName = entityName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32) || "report";
            const targetUri = `${FileSystem.documentDirectory}PL-driver-${cleanName}-${Date.now()}.pdf`;

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

    if (!entityId) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <Text style={{ color: colors.mutedForeground }}>Invalid report entity.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
            >
                <View className="mb-6 px-0 mt-5 flex-row justify-between items-center">
                    <View>
                        <Text className="text-3xl font-black" style={{ color: colors.foreground }}>Driver P&L Detail</Text>
                        <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Detailed expense report</Text>
                    </View>
                    <TouchableOpacity onPress={handleDownload} disabled={downloading}>
                        <Download size={22} color={downloading ? colors.mutedForeground : colors.foreground} />
                    </TouchableOpacity>
                </View>

                <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{entityName}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                        {summary.totalEntries} entries | {summary.approvedEntries} approved
                    </Text>
                    <Text style={{ color: colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 16 }}>
                        Total Expense: Rs {summary.totalExpense.toLocaleString()}
                    </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    <SummaryCard label="To Driver" value={summary.toDriver} tone="red" />
                    <SummaryCard label="Driver Spends" value={summary.driverSpends} tone="red" />
                </View>

                <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
                    {filteredExpenses.map((tx: any) => {
                        const date = formatDate(tx.date || tx.createdAt);
                        const isToDriver = tx.type === "TO_DRIVER";

                        return (
                            <View key={String(tx._id)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <View style={{ flex: 1, marginRight: 10 }}>
                                        <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                                            {isToDriver ? "To Driver" : "Driver Spend"}
                                        </Text>
                                        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                                            {String(tx.category || "-").replace(/_/g, " ")} | {String(tx.approvalStatus || "PENDING").toUpperCase()}
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
                                            <ArrowUpRight size={14} color="#dc2626" />
                                            <Text style={{ marginLeft: 4, color: "#dc2626", fontWeight: "800", fontSize: 11 }}>
                                                EXPENSE
                                            </Text>
                                        </View>
                                        <Text style={{ color: colors.destructive, fontWeight: "800" }}>
                                            -Rs {Math.abs(Number(tx.amount || 0)).toLocaleString()}
                                        </Text>
                                        <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "600", marginTop: 2 }}>
                                            Bal: Rs {Number(tx.runningBalance || 0).toLocaleString()}
                                        </Text>
                                        <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 1 }}>
                                            {tx.paymentMode || "CASH"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {!loading && filteredExpenses.length === 0 ? (
                        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
                            No expense transactions found for this driver.
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </View>
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
