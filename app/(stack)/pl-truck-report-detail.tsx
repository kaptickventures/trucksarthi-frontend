import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate } from "../../lib/utils";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

export default function PLTruckReportDetailScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const { truckId: rawTruckId } = useLocalSearchParams<{ truckId?: string | string[] }>();
  const truckId = Array.isArray(rawTruckId) ? rawTruckId[0] : rawTruckId || "";

  const { transactions, fetchTransactions, loading } = useFinance();
  const { trucks, fetchTrucks } = useTrucks();

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!truckId) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchTransactions(), fetchTrucks()]);
    } finally {
      setRefreshing(false);
    }
  }, [truckId, fetchTransactions, fetchTrucks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const truckName = useMemo(() => {
    const found = (trucks || []).find((item: any) => String(item._id) === truckId);
    return found?.registration_number || "Unknown Truck";
  }, [trucks, truckId]);

  const approvedTruckSpends = useMemo(() => {
    return (transactions || [])
      .filter((tx: any) => toRefId(tx.truckId) === truckId)
      .filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED")
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "EXPENSE")
      .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  }, [transactions, truckId]);

  const summary = useMemo(() => {
    const truckSpends = approvedTruckSpends
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    return {
      truckSpends,
      balance: -truckSpends,
    };
  }, [approvedTruckSpends]);

  if (!truckId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.mutedForeground }}>Invalid truck.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 30, fontWeight: "900", color: colors.foreground }}>
            Truck Report Detail
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
            Truck spends and balance
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{truckName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {approvedTruckSpends.length} approved spend entries
          </Text>
          <Text style={{ color: colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 16 }}>
            Total Balance: -Rs {Math.abs(summary.balance).toLocaleString()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>TRUCK SPENDS</Text>
            <Text style={{ color: colors.destructive, marginTop: 6, fontWeight: "800", fontSize: 14 }}>
              Rs {summary.truckSpends.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {approvedTruckSpends.map((tx: any) => (
            <View key={String(tx._id)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                    {String(tx.category || "GENERAL").replace(/_/g, " ")}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                    {String(tx.sourceModule || "-").replace(/_/g, " ")}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                    {formatDate(tx.date || tx.createdAt)}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <ArrowUpRight size={14} color="#dc2626" />
                    <Text style={{ marginLeft: 4, color: "#dc2626", fontWeight: "800", fontSize: 11 }}>
                      TRUCK SPENDS
                    </Text>
                  </View>
                  <Text style={{ color: colors.destructive, fontWeight: "800" }}>
                    -Rs {Math.abs(Number(tx.amount || 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {!loading && approvedTruckSpends.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
              No approved truck spend entries found.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
