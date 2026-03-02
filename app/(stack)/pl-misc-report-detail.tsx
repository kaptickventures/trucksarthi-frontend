import { useLocalSearchParams } from "expo-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

const toParamValue = (value?: string | string[]) => {
  if (!value) return "";
  return Array.isArray(value) ? value[0] || "" : value;
};

export default function PLMiscReportDetailScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { category: rawCategory } = useLocalSearchParams<{ category?: string | string[] }>();
  const category = toParamValue(rawCategory).toUpperCase();

  const { transactions, fetchTransactions, loading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTransactions();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return (transactions || [])
      .filter((tx: any) => String(tx.sourceModule || "").toUpperCase() === "MISC")
      .filter((tx: any) => String(tx.category || "MISC").toUpperCase() === category)
      .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  }, [transactions, category]);

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
      balance: income - expense,
      approvedCount: approved.length,
      totalCount: filtered.length,
    };
  }, [approved, filtered.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: colors.foreground }}>
            {category.replace(/_/g, " ")} Detail
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
            {summary.approvedCount} approved of {summary.totalCount} entries
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: summary.balance >= 0 ? colors.success : colors.destructive, fontWeight: "800", fontSize: 16 }}>
            Total Balance: {summary.balance >= 0 ? "+" : "-"}Rs {Math.abs(summary.balance).toLocaleString()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: isDark ? "#064e3b" : "#dcfce7", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: "#166534", fontSize: 11, fontWeight: "700" }}>INCOME</Text>
            <Text style={{ color: colors.foreground, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {summary.income.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: isDark ? "#7f1d1d" : "#fee2e2", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: "#991b1b", fontSize: 11, fontWeight: "700" }}>EXPENSE</Text>
            <Text style={{ color: colors.foreground, marginTop: 6, fontWeight: "800", fontSize: 14 }}>Rs {summary.expense.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {filtered.map((tx: any) => {
            const isIncome = String(tx.direction || "").toUpperCase() === "INCOME";
            return (
              <View key={String(tx._id)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                      {String(tx.subcategory || tx.category || "MISC").replace(/_/g, " ")}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                      {String(tx.approvalStatus || "PENDING").toUpperCase()} | {String(tx.paymentMode || "-")}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                      {formatDate(tx.date || tx.createdAt)}
                    </Text>
                    {tx.notes ? (
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }} numberOfLines={2}>
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
              No misc entries found for this category.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
