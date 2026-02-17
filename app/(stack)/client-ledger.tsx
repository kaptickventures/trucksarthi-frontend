import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../api/axiosInstance";
import useClients from "../../hooks/useClient";
import { useThemeStore } from "../../hooks/useThemeStore";

type ClientSummary = {
  total_debits: number;
  total_credits: number;
  outstanding: number;
};

export default function ClientLedgerScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { clients, fetchClients } = useClients();
  const [refreshing, setRefreshing] = useState(false);
  const [summaryByClient, setSummaryByClient] = useState<Record<string, ClientSummary>>({});

  const load = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const run = async () => {
      const next: Record<string, ClientSummary> = {};
      await Promise.all(
        (clients || []).map(async (client) => {
          try {
            const res = await API.get(`/api/ledger/client/${client._id}/summary`);
            next[client._id] = {
              total_debits: Number(res.data?.total_debits || 0),
              total_credits: Number(res.data?.total_credits || 0),
              outstanding: Number(res.data?.outstanding || 0),
            };
          } catch {
            next[client._id] = { total_debits: 0, total_credits: 0, outstanding: 0 };
          }
        })
      );
      setSummaryByClient(next);
    };
    if (clients?.length) run();
  }, [clients]);

  const totals = useMemo(() => {
    const rows = Object.values(summaryByClient);
    const billed = rows.reduce((a, b) => a + b.total_debits, 0);
    const received = rows.reduce((a, b) => a + b.total_credits, 0);
    const outstanding = rows.reduce((a, b) => a + b.outstanding, 0);
    return { billed, received, outstanding };
  }, [summaryByClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Client Ledger</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <SummaryCard label="Billed" value={`₹${totals.billed.toLocaleString()}`} />
          <SummaryCard label="Received" value={`₹${totals.received.toLocaleString()}`} />
          <SummaryCard label="Outstanding" value={`₹${totals.outstanding.toLocaleString()}`} color={colors.destructive} />
        </View>

        {(clients || []).map((client) => {
          const row = summaryByClient[client._id] || { total_debits: 0, total_credits: 0, outstanding: 0 };
          return (
            <TouchableOpacity
              key={client._id}
              onPress={() => router.push({ pathname: "/(stack)/client-ledger-detail", params: { clientId: client._id } })}
              style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ color: colors.foreground, fontWeight: "700", flex: 1, marginRight: 8 }}>{client.client_name}</Text>
                <Text style={{ color: colors.destructive, fontWeight: "800" }}>₹{row.outstanding.toLocaleString()}</Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{client.contact_person_name || "-"}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                Billed: ₹{row.total_debits.toLocaleString()} | Received: ₹{row.total_credits.toLocaleString()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: color || colors.foreground, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
