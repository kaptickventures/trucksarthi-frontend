import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpRight } from "lucide-react-native";
import useTrucks from "../../hooks/useTruck";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

export default function PLTruckReportScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, loading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTrucks(), fetchTransactions()]);
    setRefreshing(false);
  }, [fetchTrucks, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => {
    return (trucks || [])
      .map((truck: any) => {
        const truckId = String(truck._id);
        const items = (transactions || []).filter((tx: any) => toRefId(tx.truckId) === truckId);
        const approvedSpends = items
          .filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED")
          .filter((tx: any) => String(tx.direction || "").toUpperCase() === "EXPENSE");

        const truckSpends = approvedSpends
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        return {
          id: truckId,
          name: truck.registration_number || "Unknown Truck",
          truckSpends,
          balance: -truckSpends,
          count: approvedSpends.length,
        };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [trucks, transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="mb-3 px-0">
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('truckPL')}</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Truck-wise operating P&L summary</Text>
          </View>
        }
        ListEmptyComponent={<Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 60 }}>{loading ? "Loading..." : "No truck report data."}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(stack)/pl-truck-report-detail",
                params: { truckId: item.id },
              } as any)
            }
            style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}
          >
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }}>{item.name}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{item.count} spend entries</Text>

            <View style={{ marginTop: 10 }}>
              <View style={{ borderRadius: 10, padding: 10, backgroundColor: isDark ? "#7f1d1d" : "#fee2e2" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                  <ArrowUpRight size={14} color="#dc2626" />
                  <Text style={{ marginLeft: 4, color: "#991b1b", fontWeight: "700", fontSize: 10 }}>TRUCK SPENDS</Text>
                </View>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Rs {item.truckSpends.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={{ color: "#dc2626", marginTop: 10, fontWeight: "700" }}>
              Total Balance: -Rs {Math.abs(item.balance).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
