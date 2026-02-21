import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate } from "../../lib/utils";

export default function RunningExpensesScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucks();
  const { transactions, loading: financeLoading, fetchTransactions } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), []);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchTrucks(),
      fetchTransactions({
        startDate: monthStart,
        endDate: new Date().toISOString(),
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
    const map: Record<string, number> = {};
    const fuelDateMap: Record<string, string> = {};
    (transactions || []).forEach((item: any) => {
      const key = String(item?.truckId || "");
      if (!key) return;
      map[key] = (map[key] || 0) + Number(item?.amount || 0);
      const isFuel = item?.transactionSubtype === "FUEL" || item?.category === "FUEL";
      if (isFuel && item?.date && (!fuelDateMap[key] || new Date(item.date) > new Date(fuelDateMap[key]))) {
        fuelDateMap[key] = item.date;
      }
    });
    return { map, fuelDateMap };
  }, [transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Running Expenses</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {(trucks || []).map((truck: any) => {
          const truckId = String(truck._id);
          const monthlyExpense = monthlyByTruck.map[truckId] || 0;
          const lastFuelDate = monthlyByTruck.fuelDateMap[truckId];
          return (
            <TouchableOpacity
              key={truckId}
              onPress={() => router.push({ pathname: "/(stack)/running-expenses-dashboard", params: { truckId } } as any)}
              style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 }}
            >
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>{truck.registration_number || "Unknown Truck"}</Text>
              <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>Last fuel: {lastFuelDate ? formatDate(lastFuelDate) : "-"}</Text>
              <Text style={{ color: colors.foreground, marginTop: 2, fontWeight: "700" }}>Monthly: ₹{Number(monthlyExpense).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        })}

        {!trucksLoading && !financeLoading && (trucks || []).length === 0 && <Text style={{ color: colors.mutedForeground }}>No trucks.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

