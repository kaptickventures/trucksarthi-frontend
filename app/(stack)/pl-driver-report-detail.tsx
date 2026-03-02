import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useDrivers from "../../hooks/useDriver";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

type DriverTab = "TO_DRIVER" | "DRIVER_SPENDS";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

export default function PLDriverReportDetailScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const { driverId: rawDriverId } = useLocalSearchParams<{ driverId?: string | string[] }>();
  const driverId = Array.isArray(rawDriverId) ? rawDriverId[0] : rawDriverId || "";

  const { transactions, fetchTransactions, loading } = useFinance();
  const { drivers, fetchDrivers } = useDrivers();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DriverTab>("TO_DRIVER");

  const loadData = useCallback(async () => {
    if (!driverId) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchTransactions(), fetchDrivers()]);
    } finally {
      setRefreshing(false);
    }
  }, [driverId, fetchDrivers, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const driverName = useMemo(() => {
    const found = (drivers || []).find((item: any) => String(item._id) === driverId);
    return found?.driver_name || found?.name || "Unknown Driver";
  }, [drivers, driverId]);

  const approvedDriverTransactions = useMemo(() => {
    return (transactions || [])
      .filter((tx: any) => toRefId(tx.driverId) === driverId)
      .filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED")
      .sort((a: any, b: any) => new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());
  }, [transactions, driverId]);

  const totals = useMemo(() => {
    const toDriver = approvedDriverTransactions
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "INCOME")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    const driverSpends = approvedDriverTransactions
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "EXPENSE")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    return {
      toDriver,
      driverSpends,
      balance: toDriver - driverSpends,
    };
  }, [approvedDriverTransactions]);

  const transactionsWithBalance = useMemo(() => {
    let runningBalance = 0;

    const entries = approvedDriverTransactions.map((tx: any) => {
      const isToDriver = String(tx.direction || "").toUpperCase() === "INCOME";
      const amount = Number(tx.amount || 0);
      runningBalance += isToDriver ? amount : -amount;
      return {
        ...tx,
        kind: isToDriver ? "TO_DRIVER" : "DRIVER_SPENDS",
        amount,
        balanceAfter: runningBalance,
      };
    });

    return entries.reverse();
  }, [approvedDriverTransactions]);

  const filtered = useMemo(
    () => transactionsWithBalance.filter((tx: any) => tx.kind === activeTab),
    [transactionsWithBalance, activeTab]
  );

  if (!driverId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.mutedForeground }}>Invalid driver.</Text>
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
            Driver Khata Detail
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
            To driver, driver spends and running balance
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{driverName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {approvedDriverTransactions.length} approved entries
          </Text>
          <Text style={{ color: totals.balance >= 0 ? colors.success : colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 16 }}>
            Total Balance: {totals.balance >= 0 ? "+" : "-"}Rs {Math.abs(totals.balance).toLocaleString()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>TO DRIVER</Text>
            <Text style={{ color: colors.success, marginTop: 6, fontWeight: "800", fontSize: 14 }}>
              Rs {totals.toDriver.toLocaleString()}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>DRIVER SPENDS</Text>
            <Text style={{ color: colors.destructive, marginTop: 6, fontWeight: "800", fontSize: 14 }}>
              Rs {totals.driverSpends.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {([
            { id: "TO_DRIVER", label: "To Driver" },
            { id: "DRIVER_SPENDS", label: "Driver Spends" },
          ] as { id: DriverTab; label: string }[]).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: activeTab === tab.id ? colors.primary : colors.border,
                backgroundColor: activeTab === tab.id ? colors.primary : "transparent",
                paddingVertical: 9,
                alignItems: "center",
              }}
            >
              <Text style={{ color: activeTab === tab.id ? "white" : colors.foreground, fontWeight: "700", fontSize: 12 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {filtered.map((tx: any) => {
            const isToDriver = tx.kind === "TO_DRIVER";

            return (
              <View key={String(tx._id)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                      {isToDriver ? "To Driver" : "Driver Spend"}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                      {String(tx.category || "DRIVER_KHATA").replace(/_/g, " ")}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                      {formatDate(tx.date || tx.createdAt)}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      {isToDriver ? <ArrowDownLeft size={14} color="#16a34a" /> : <ArrowUpRight size={14} color="#dc2626" />}
                      <Text style={{ marginLeft: 4, color: isToDriver ? "#16a34a" : "#dc2626", fontWeight: "800", fontSize: 11 }}>
                        {isToDriver ? "TO DRIVER" : "DRIVER SPENDS"}
                      </Text>
                    </View>
                    <Text style={{ color: isToDriver ? colors.success : colors.destructive, fontWeight: "800" }}>
                      {isToDriver ? "+" : "-"}Rs {Math.abs(Number(tx.amount || 0)).toLocaleString()}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>
                      Bal: {Number(tx.balanceAfter || 0) >= 0 ? "+" : "-"}Rs {Math.abs(Number(tx.balanceAfter || 0)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {!loading && filtered.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
              No approved entries in this tab.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
