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
  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions } = useFinance();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Maintenance Khata</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {(trucks || []).map((truck: any) => {
          const truckId = String(truck._id);
          return (
            <TouchableOpacity
              key={truckId}
              onPress={() => router.push({ pathname: "/(stack)/maintenance-dashboard", params: { truckId } } as any)}
              style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 }}
            >
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>{truck.registration_number || "Unknown Truck"}</Text>
              <Text style={{ color: colors.foreground, marginTop: 6, fontWeight: "700" }}>Lifetime: ₹{Number(lifetimeByTruck[truckId] || 0).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

