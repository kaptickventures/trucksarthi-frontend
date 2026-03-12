import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Skeleton } from "../../components/Skeleton";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { useTranslation } from "../../context/LanguageContext";

export default function DailyKhataScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucks();
  const { transactions, loading: financeLoading, fetchTransactions } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const monthStart = useMemo(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    []
  );

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchTrucks(),
      fetchTransactions({
        direction: "EXPENSE",
        sourceModule: "RUNNING_EXPENSE",
      }),
    ]);
  }, [fetchTrucks, fetchTransactions, monthStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const monthlyByTruck = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    const latestFuelByTruck: Record<string, { amount: number; date: string }> = {};

    (transactions || []).forEach((item: any) => {
      const key = String(item?.truckId || "");
      if (!key) return;

      monthlyMap[key] = (monthlyMap[key] || 0) + Number(item?.amount || 0);

      const isFuel = item?.transactionSubtype === "FUEL" || item?.category === "FUEL";
      if (!isFuel) return;

      const currentDate = new Date(item?.date || 0).getTime();
      const prevDate = new Date(latestFuelByTruck[key]?.date || 0).getTime();
      if (!latestFuelByTruck[key] || currentDate > prevDate) {
        latestFuelByTruck[key] = {
          amount: Number(item?.amount || 0),
          date: item?.date,
        };
      }
    });

    return { monthlyMap, latestFuelByTruck };
  }, [transactions]);

  const loading = trucksLoading || financeLoading;
  const showInitialSkeleton = loading && !refreshing && (trucks || []).length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('runningExpenses')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Track fuel and trip costs</Text>
        </View>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="w-full h-32 rounded-2xl mb-3" />
            ))}
          </View>
        )}

        {!loading && (trucks || []).length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
            No trucks found.
          </Text>
        )}

        {(trucks || []).map((truck: any) => {
          const truckId = String(truck._id);
          const monthlyExpense = monthlyByTruck.monthlyMap[truckId] || 0;
          const lastFuelAmount = monthlyByTruck.latestFuelByTruck[truckId]?.amount || 0;
          const hasActivity = monthlyExpense > 0;

          return (
            <TouchableOpacity
              key={truckId}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/daily-khata-dashboard",
                  params: { truckId },
                } as any)
              }
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <View>
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3, marginBottom: 8 }}>
                  {truck.registration_number || "Unknown Truck"}
                </Text>

                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 2 }}>
                      TOTAL
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                      Rs {monthlyExpense.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border }} />
                  <View>
                    <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 2 }}>
                      LAST FUEL
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: lastFuelAmount > 0 ? "#ea580c" : colors.mutedForeground }}>
                      {lastFuelAmount > 0 ? `Rs ${lastFuelAmount.toLocaleString()}` : "—"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: colors.primary + '10', width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
