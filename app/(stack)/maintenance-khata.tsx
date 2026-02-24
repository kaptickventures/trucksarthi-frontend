import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";

export default function MaintenanceKhataScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Maintenance Khata</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
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
              }}
            >
              {/* Top row: truck number + total badge */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3 }}>
                    {truck.registration_number || "Unknown Truck"}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: hasActivity ? "#fee2e2" : colors.border + "40",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: hasActivity ? "#dc2626" : colors.mutedForeground,
                    }}
                  >
                    {hasActivity ? `-Rs ${totalExpense.toLocaleString()}` : "No spend"}
                  </Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>
                    TOTAL REPAIR COST
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
                    Rs {totalExpense.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Bottom row: CTA */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
