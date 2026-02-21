import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QuickActionButton from "../../components/finance/QuickActionButton";
import SummaryStatCard from "../../components/finance/SummaryStatCard";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate } from "../../lib/utils";

const MAINTENANCE_ACTIONS = ["DOCUMENT", "SERVICE", "REPAIR"] as const;

export default function MaintenanceDashboardScreen() {
  const router = useRouter();
  const { truckId } = useLocalSearchParams<{ truckId?: string }>();
  const { colors, theme } = useThemeStore();
  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const selectedTruck = useMemo(() => (trucks || []).find((t: any) => String(t._id) === String(truckId)), [trucks, truckId]);
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), []);

  const loadData = useCallback(async () => {
    if (!truckId) return;
    await Promise.all([
      fetchTrucks(),
      fetchTransactions({ direction: "EXPENSE", sourceModule: "MAINTENANCE", truckId }),
    ]);
  }, [fetchTrucks, fetchTransactions, truckId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const truckRows = useMemo(
    () => (transactions || []).filter((t: any) => String(t?.truckId || "") === String(truckId)),
    [transactions, truckId]
  );
  const lifetimeTotal = useMemo(() => truckRows.reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0), [truckRows]);
  const monthlyTotal = useMemo(
    () => truckRows.filter((t: any) => t?.date && new Date(t.date) >= new Date(monthStart)).reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0),
    [truckRows, monthStart]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginLeft: 14 }}>
          {selectedTruck?.registration_number || "Truck"} Maintenance
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <SummaryStatCard label="Lifetime" value={`₹${lifetimeTotal.toLocaleString()}`} />
          <SummaryStatCard label="Monthly" value={`₹${monthlyTotal.toLocaleString()}`} />
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {MAINTENANCE_ACTIONS.map((action) => (
              <QuickActionButton
                key={action}
                label={action}
                onPress={() => router.push({ pathname: "/(stack)/maintenance-add", params: { truckId: String(truckId), serviceType: action } } as any)}
              />
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {truckRows.map((item: any) => (
            <View key={item._id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>{item.serviceType || item.category || "Maintenance"}</Text>
                <Text style={{ color: colors.destructive, fontWeight: "800" }}>-₹{Number(item.amount || 0).toLocaleString()}</Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatDate(item.date)} | {item.paymentMode || "-"}</Text>
            </View>
          ))}
          {truckRows.length === 0 && <Text style={{ color: colors.mutedForeground }}>No entries.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

