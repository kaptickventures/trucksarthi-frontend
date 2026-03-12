import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Skeleton } from "../../components/Skeleton";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { useTranslation } from "../../context/LanguageContext";

export default function MaintenanceKhataScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucks();
  const { transactions, loading: financeLoading, fetchTransactions } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchTrucks(),
      fetchTransactions({ direction: "EXPENSE", sourceModule: "MAINTENANCE" }),
    ]);
  }, [fetchTrucks, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const lifetimeByTruck = useMemo(() => {
    const map: Record<string, number> = {};
    (transactions || []).forEach((item: any) => {
      const key = String(item?.truckId || "");
      if (!key) return;
      map[key] = (map[key] || 0) + Number(item?.amount || 0);
    });
    return map;
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
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('maintenanceKhata')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Track truck repair and service history</Text>
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
          const totalExpense = lifetimeByTruck[truckId] || 0;
          const hasActivity = totalExpense > 0;

          return (
            <TouchableOpacity
              key={truckId}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/maintenance-dashboard",
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
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3, marginBottom: 6 }}>
                  {truck.registration_number || "Unknown Truck"}
                </Text>

                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 2 }}>
                  TOTAL MAINTENANCE COST
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                  Rs {totalExpense.toLocaleString()}
                </Text>
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
