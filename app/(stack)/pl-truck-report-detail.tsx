import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
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

  const approvedTruckTransactions = useMemo(() => {
    return (transactions || [])
      .filter((tx: any) => toRefId(tx.truckId) === truckId)
      .filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED")
      .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  }, [transactions, truckId]);

  const summary = useMemo(() => {
    const income = approvedTruckTransactions
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "INCOME")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    const expense = approvedTruckTransactions
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "EXPENSE")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [approvedTruckTransactions]);

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
            Truck income, expense and total balance
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{truckName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {approvedTruckTransactions.length} approved entries
          </Text>
          <Text style={{ color: summary.balance >= 0 ? colors.success : colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 16 }}>
            Total Balance: {summary.balance >= 0 ? "+" : "-"}Rs {Math.abs(summary.balance).toLocaleString()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>INCOME</Text>
            <Text style={{ color: colors.success, marginTop: 6, fontWeight: "800", fontSize: 14 }}>
              Rs {summary.income.toLocaleString()}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>EXPENSE</Text>
            <Text style={{ color: colors.destructive, marginTop: 6, fontWeight: "800", fontSize: 14 }}>
              Rs {summary.expense.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {approvedTruckTransactions.map((tx: any) => {
            const isIncome = String(tx.direction || "").toUpperCase() === "INCOME";
            return (
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
                      {isIncome ? <ArrowDownLeft size={14} color="#16a34a" /> : <ArrowUpRight size={14} color="#dc2626" />}
                      <Text style={{ marginLeft: 4, color: isIncome ? "#16a34a" : "#dc2626", fontWeight: "800", fontSize: 11 }}>
                        {isIncome ? "INCOME" : "EXPENSE"}
                      </Text>
                    </View>
                    <Text style={{ color: isIncome ? colors.success : colors.destructive, fontWeight: "800" }}>
                      {isIncome ? "+" : "-"}Rs {Math.abs(Number(tx.amount || 0)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {!loading && approvedTruckTransactions.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
              No approved truck report entries found.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
