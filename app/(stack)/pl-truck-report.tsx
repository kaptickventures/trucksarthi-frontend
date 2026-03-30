import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useTrucks from "../../hooks/useTruck";
import useFinance from "../../hooks/useFinance";
import useTrips from "../../hooks/useTrip";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { Skeleton } from "../../components/Skeleton";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

export default function PLTruckReportScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, loading: finLoading } = useFinance();
  const { trips, fetchTrips, loading: tripLoading } = useTrips();
  const [refreshing, setRefreshing] = useState(false);

  const loading = finLoading || tripLoading;

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTrucks(), fetchTransactions(), fetchTrips()]);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [fetchTrucks, fetchTransactions, fetchTrips]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => {
    return (trucks || [])
      .map((truck: any) => {
        const truckId = String(truck._id);

        // Income from Trips
        const truckTrips = (trips || []).filter((t: any) => toRefId(t.truck) === truckId);
        const tripIncome = truckTrips.reduce((sum: number, t: any) => sum + Number(t.cost_of_trip || 0), 0);

        // Expenses and Other from Finance Transactions
        const items = (transactions || []).filter((tx: any) => toRefId(tx.truckId) === truckId);
        const approved = items.filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED");

        const otherIncome = approved
          .filter((tx: any) => String(tx.direction || "").toUpperCase() === "INCOME")
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        const truckExpense = approved
          .filter((tx: any) => String(tx.direction || "").toUpperCase() === "EXPENSE")
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        const totalIncome = tripIncome + otherIncome;

        return {
          id: truckId,
          name: truck.registration_number || "Unknown Truck",
          truckIncome: totalIncome,
          truckExpense,
          balance: totalIncome - truckExpense,
          count: truckTrips.length + approved.length,
        };
      })
      .sort((a, b) => b.truckIncome - a.truckIncome);
  }, [trucks, transactions, trips]);

  const showInitialSkeleton = loading && !refreshing && (trucks || []).length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View className="mb-3">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('truckPL') || 'Truck P&L'}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Truck-wise profit & loss summary</Text>
        </View>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} width="100%" height={100} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {!loading && (trucks || []).length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>No trucks found.</Text>
        )}

        {rows.map((item) => {
          const isPositive = item.balance >= 0;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/pl-truck-report-detail",
                  params: { truckId: item.id },
                } as any)
              }
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3 }}>
                    {item.name}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: isPositive ? colors.success + '20' : colors.destructive + '20',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "800", color: isPositive ? colors.success : colors.destructive }}>
                    {isPositive ? "+" : "-"}? {Math.abs(item.balance).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 16, marginBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>INCOME</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}> ₹ {item.truckIncome.toLocaleString()}
                  </Text>
                </View>
                <View style={{ width: 1, height: 24, backgroundColor: colors.border, alignSelf: 'center' }} />
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>EXPENSE</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.destructive }}> ₹ {item.truckExpense.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: colors.border + "40",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.mutedForeground }}>
                    {item.count} ENTRIES
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>View Report</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
