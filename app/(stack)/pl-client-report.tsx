import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft } from "lucide-react-native";
import useClients from "../../hooks/useClient";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

export default function PLClientReportScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { clients, fetchClients } = useClients();
  const { transactions, fetchTransactions, loading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchClients(), fetchTransactions()]);
    setRefreshing(false);
  }, [fetchClients, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => {
    return (clients || [])
      .map((client: any) => {
        const clientId = String(client._id);
        const items = (transactions || []).filter((tx: any) => toRefId(tx.clientId) === clientId);
        const approved = items.filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED");
        const fromClient = approved
          .filter((tx: any) => String(tx.direction || "").toUpperCase() === "INCOME")
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        return {
          id: clientId,
          name: client.client_name || "Unknown Client",
          fromClient,
          balance: fromClient,
          count: items.length,
        };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [clients, transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.foreground} /></TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Client Khata Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 60 }}>{loading ? "Loading..." : "No client report data."}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(stack)/pl-client-report-detail",
                params: { clientId: item.id },
              } as any)
            }
            style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}
          >
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }}>{item.name}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{item.count} entries</Text>
            <View style={{ marginTop: 10 }}>
              <View style={{ borderRadius: 10, padding: 10, backgroundColor: isDark ? "#064e3b" : "#dcfce7" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                  <ArrowDownLeft size={14} color="#16a34a" />
                  <Text style={{ marginLeft: 4, color: "#166534", fontWeight: "700", fontSize: 10 }}>FROM CLIENT</Text>
                </View>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Rs {item.fromClient.toLocaleString()}</Text>
              </View>
            </View>
            <Text style={{ color: item.balance >= 0 ? "#16a34a" : "#dc2626", marginTop: 10, fontWeight: "700" }}>
              Total Balance: {item.balance >= 0 ? "+" : "-"}Rs {Math.abs(item.balance).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
