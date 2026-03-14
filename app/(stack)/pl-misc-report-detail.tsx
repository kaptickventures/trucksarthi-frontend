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
import { formatDate } from "../../lib/utils";

const toParamValue = (value?: string | string[]) => {
  if (!value) return "";
  return Array.isArray(value) ? value[0] || "" : value;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function PLMiscReportDetailScreen() {
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { category: rawCategory } = useLocalSearchParams<{ category?: string | string[] }>();
  const category = toParamValue(rawCategory).toUpperCase();

  const { transactions, fetchTransactions, loading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTransactions({ sourceModule: "MISC", category });
    } finally {
      setRefreshing(false);
    }
  }, [fetchTransactions, category]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return (transactions || [])
      .filter((tx: any) => String(tx.sourceModule || "").toUpperCase() === "MISC")
      .filter((tx: any) => String(tx.category || "MISC").toUpperCase() === category)
      .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  }, [transactions, category]);

  const approved = useMemo(() => filtered.filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED"), [filtered]);

  const summary = useMemo(() => {
    const income = approved.filter((tx: any) => String(tx.direction || "").toUpperCase() === "INCOME").reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    const expense = approved.filter((tx: any) => String(tx.direction || "").toUpperCase() === "EXPENSE").reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    return {
      income,
      expense,
      balance: income - expense,
      approvedCount: approved.length,
      totalCount: filtered.length,
    };
  }, [approved, filtered.length]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const rowsHtml = filtered
        .map((tx: any, index: number) => {
          const isIncome = String(tx.direction || "").toUpperCase() === "INCOME";
          const signed = `${isIncome ? "+" : "-"}Rs ${Math.abs(Number(tx.amount || 0)).toLocaleString()}`;
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatDate(tx.date || tx.createdAt))}</td>
            <td>${escapeHtml(String(tx.subcategory || tx.category || "MISC").replace(/_/g, " "))}</td>
            <td>${escapeHtml(String(tx.approvalStatus || "PENDING").toUpperCase())}</td>
            <td>${escapeHtml(String(tx.paymentMode || "CASH").toUpperCase())}</td>
            <td class="${isIncome ? "pos" : "neg"}">${escapeHtml(signed)}</td>
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
        <h1>Misc P&L Detail</h1>
        <div class="sub">Category: ${escapeHtml(category.replace(/_/g, " "))}</div>
        <div class="sub">Generated on: ${escapeHtml(formatDate(new Date()))}</div>
        <div class="cards">
          <div class="card"><div class="label">Income</div><div class="value">Rs ${summary.income.toLocaleString()}</div></div>
          <div class="card"><div class="label">Expense</div><div class="value">Rs ${summary.expense.toLocaleString()}</div></div>
          <div class="card"><div class="label">Net</div><div class="value">${summary.balance >= 0 ? "+" : "-"}Rs ${Math.abs(summary.balance).toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Entry</th><th>Status</th><th>Mode</th><th>Amount</th></tr></thead>
          <tbody>${rowsHtml || `<tr><td colspan="6">No entries found.</td></tr>`}</tbody>
        </table>
      </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const cleanName = category.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32) || "misc";
      const targetUri = `${FileSystem.documentDirectory}PL-misc-${cleanName}-${Date.now()}.pdf`;
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
              {t("miscPL")}
            </Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
              {category.replace(/_/g, " ")}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDownload} disabled={downloading} style={{ paddingTop: 2 }}>
            <Download size={22} color={downloading ? colors.mutedForeground : colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: summary.balance >= 0 ? colors.success : colors.destructive, fontWeight: "800", fontSize: 16 }}>
            Net: {summary.balance >= 0 ? "+" : "-"}Rs {Math.abs(summary.balance).toLocaleString()}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {summary.approvedCount} approved of {summary.totalCount} entries
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{(t("income") || "Income").toUpperCase()}</Text>
            <Text style={{ color: colors.success, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {summary.income.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{(t("expense") || "Expense").toUpperCase()}</Text>
            <Text style={{ color: colors.destructive, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {summary.expense.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {filtered.map((tx: any, idx: number) => {
            const isIncome = String(tx.direction || "").toUpperCase() === "INCOME";
            return (
              <View key={String(tx._id)} style={{ borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: idx === 0 ? 0 : 10, marginTop: idx === 0 ? 0 : 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>{String(tx.subcategory || tx.category || "MISC").replace(/_/g, " ")}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{String(tx.notes || "-")}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{formatDate(tx.date || tx.createdAt)}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      {isIncome ? <ArrowDownLeft size={14} color={colors.success} /> : <ArrowUpRight size={14} color={colors.destructive} />}
                      <Text style={{ marginLeft: 4, color: isIncome ? colors.success : colors.destructive, fontWeight: "800", fontSize: 11 }}>
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
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>No misc entries found for this category.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
