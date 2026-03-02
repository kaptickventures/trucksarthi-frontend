import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft } from "lucide-react-native";

import useClients from "../../hooks/useClient";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

const toRefId = (value: any) =>
  typeof value === "string" ? value : value?._id ? String(value._id) : "";

export default function PLClientReportDetailScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const { clientId: rawClientId } = useLocalSearchParams<{ clientId?: string | string[] }>();
  const clientId = Array.isArray(rawClientId) ? rawClientId[0] : rawClientId || "";

  const { transactions, fetchTransactions, loading } = useFinance();
  const { clients, fetchClients } = useClients();

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!clientId) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchTransactions(), fetchClients()]);
    } finally {
      setRefreshing(false);
    }
  }, [clientId, fetchClients, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clientName = useMemo(() => {
    const found = (clients || []).find((item: any) => String(item._id) === clientId);
    return found?.client_name || "Unknown Client";
  }, [clients, clientId]);

  const approvedFromClient = useMemo(() => {
    return (transactions || [])
      .filter((tx: any) => toRefId(tx.clientId) === clientId)
      .filter((tx: any) => String(tx.approvalStatus || "").toUpperCase() === "APPROVED")
      .filter((tx: any) => String(tx.direction || "").toUpperCase() === "INCOME")
      .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  }, [transactions, clientId]);

  const totalBalance = useMemo(
    () => approvedFromClient.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0),
    [approvedFromClient]
  );

  if (!clientId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.mutedForeground }}>Invalid client.</Text>
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
            Client Khata Detail
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
            From client entries and balance summary
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{clientName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {approvedFromClient.length} approved entries
          </Text>
          <Text style={{ color: totalBalance >= 0 ? colors.success : colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 16 }}>
            Total Balance: {totalBalance >= 0 ? "+" : "-"}Rs {Math.abs(totalBalance).toLocaleString()}
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>FROM CLIENT</Text>
          <Text style={{ color: colors.success, marginTop: 6, fontWeight: "800", fontSize: 15 }}>
            Rs {totalBalance.toLocaleString()}
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          {approvedFromClient.map((tx: any) => (
            <View key={String(tx._id)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                    {String(tx.category || "CLIENT_PAYMENT").replace(/_/g, " ")}
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
                    <ArrowDownLeft size={14} color="#16a34a" />
                    <Text style={{ marginLeft: 4, color: "#16a34a", fontWeight: "800", fontSize: 11 }}>
                      FROM CLIENT
                    </Text>
                  </View>
                  <Text style={{ color: colors.success, fontWeight: "800" }}>
                    +Rs {Math.abs(Number(tx.amount || 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {!loading && approvedFromClient.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
              No approved client khata entries found.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
