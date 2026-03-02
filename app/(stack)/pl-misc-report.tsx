import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

export default function PLMiscReportScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { transactions, fetchTransactions, loading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => {
    const misc = (transactions || []).filter(
      (tx: any) => String(tx.sourceModule || "").toUpperCase() === "MISC"
    );
    const grouped = new Map<string, { category: string; income: number; expense: number; count: number }>();
    for (const tx of misc as any[]) {
      const key = String(tx.category || "MISC").toUpperCase();
      if (!grouped.has(key)) grouped.set(key, { category: key, income: 0, expense: 0, count: 0 });
      const row = grouped.get(key)!;
      row.count += 1;
      if (String(tx.approvalStatus || "").toUpperCase() === "APPROVED") {
        if (String(tx.direction || "").toUpperCase() === "INCOME") row.income += Number(tx.amount || 0);
        if (String(tx.direction || "").toUpperCase() === "EXPENSE") row.expense += Number(tx.amount || 0);
      }
    }
    return Array.from(grouped.values())
      .map((r) => ({ ...r, net: r.income - r.expense }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [transactions]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <FlatList
        data={rows}
        keyExtractor={(item) => item.category}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="mb-3 px-0">
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('miscPL')}</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('viewMiscPL')}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 60 }}>{loading ? "Loading..." : "No misc report data."}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(stack)/pl-misc-report-detail",
                params: { category: item.category },
              } as any)
            }
            style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}
          >
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }}>{item.category.replace(/_/g, " ")}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{item.count} entries</Text>
            <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
              <View style={{ flex: 1, borderRadius: 10, padding: 8, backgroundColor: isDark ? "#064e3b" : "#dcfce7" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                  <ArrowDownLeft size={14} color="#16a34a" />
                  <Text style={{ marginLeft: 4, color: "#166534", fontWeight: "700", fontSize: 10 }}>INCOME</Text>
                </View>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Rs {item.income.toLocaleString()}</Text>
              </View>
              <View style={{ flex: 1, borderRadius: 10, padding: 8, backgroundColor: isDark ? "#7f1d1d" : "#fee2e2" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                  <ArrowUpRight size={14} color="#dc2626" />
                  <Text style={{ marginLeft: 4, color: "#991b1b", fontWeight: "700", fontSize: 10 }}>EXPENSE</Text>
                </View>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Rs {item.expense.toLocaleString()}</Text>
              </View>
            </View>
            <Text style={{ color: item.net >= 0 ? "#16a34a" : "#dc2626", marginTop: 10, fontWeight: "700" }}>
              Net: {item.net >= 0 ? "+" : "-"}Rs {Math.abs(item.net).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
