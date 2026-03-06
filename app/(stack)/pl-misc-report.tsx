import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { Skeleton } from "../../components/Skeleton";

export default function PLMiscReportScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { transactions, fetchTransactions, loading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTransactions({ sourceModule: "MISC" });
    } finally {
      setRefreshing(false);
    }
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

  const showInitialSkeleton = loading && !refreshing && rows.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View className="mb-3">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>
            {t("miscPL") || "Misc P&L"}
          </Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
            {t("viewMiscPL") || "View misc category-wise reports"}
          </Text>
        </View>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {!loading && rows.length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>No misc reports to render.</Text>
        )}

        {rows.map((item) => (
          <TouchableOpacity
            key={item.category}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(stack)/pl-misc-report-detail",
                params: { category: item.category },
              } as any)
            }
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              marginBottom: 12
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "800" }}>{item.category.replace(/_/g, " ")}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{item.count} {t('entries') || 'entries'}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: item.net >= 0 ? colors.success + '20' : colors.destructive + '20' }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: item.net >= 0 ? colors.success : colors.destructive }}>
                  {item.net >= 0 ? "+" : "-"}Rs {Math.abs(item.net).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
              <View>
                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{t('income')?.toUpperCase() || 'INCOME'}</Text>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>Rs {item.income.toLocaleString()}</Text>
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: colors.border, alignSelf: 'center' }} />
              <View>
                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{t('expense')?.toUpperCase() || 'EXPENSE'}</Text>
                <Text style={{ color: colors.destructive, fontWeight: "700", fontSize: 13 }}>Rs {item.expense.toLocaleString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
