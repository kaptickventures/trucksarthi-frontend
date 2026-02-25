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
import useClients from "../../hooks/useClient";
import { useClientLedger } from "../../hooks/useClientLedger";
import { useThemeStore } from "../../hooks/useThemeStore";

type ClientRow = {
  clientId: string;
  clientName: string;
  billed: number;
  settled: number;
  unbilled: number;
};

export default function ClientLedgerScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { clients, fetchClients } = useClients();
  const { fetchSummary } = useClientLedger();

  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<ClientRow[]>([]);

  const load = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      const next: ClientRow[] = [];

      await Promise.all(
        (clients || []).map(async (client: any) => {
          try {
            const summary = await fetchSummary(client._id);
            const billed = Number(summary?.total_debits || 0);
            const settled = Number(summary?.total_credits || 0);
            const unbilled = Math.max(0, billed - settled);
            next.push({
              clientId: String(client._id),
              clientName: client.client_name,
              billed,
              settled,
              unbilled,
            });
          } catch {
            next.push({
              clientId: String(client._id),
              clientName: client.client_name,
              billed: 0,
              settled: 0,
              unbilled: 0,
            });
          }
        })
      );

      if (isMounted) {
        setRows(
          next.sort((a, b) => {
            // Primary sort: Unbilled amount (descending)
            if (b.unbilled !== a.unbilled) {
              return b.unbilled - a.unbilled;
            }
            // Secondary sort: Client name (ascending) for deterministic order
            return a.clientName.localeCompare(b.clientName);
          })
        );
      }
    };

    if (clients?.length) {
      run();
    } else {
      setRows([]);
    }

    return () => {
      isMounted = false;
    };
  }, [clients, fetchSummary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Client Khata</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {rows.length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>No clients found.</Text>
        )}

        {rows.map((row) => {
          const hasOutstanding = row.unbilled > 0;
          const isSettled = row.billed > 0 && row.unbilled === 0;

          return (
            <TouchableOpacity
              key={row.clientId}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/client-ledger-detail",
                  params: { clientId: row.clientId },
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
              {/* Top row: name + outstanding badge */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3 }}>
                    {row.clientName}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: hasOutstanding ? "#fee2e2" : "#dcfce7",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: hasOutstanding ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {hasOutstanding ? `-Rs ${row.unbilled.toLocaleString()} due` : "Settled"}
                  </Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>BILLED</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
                    Rs {row.billed.toLocaleString()}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>RECEIVED</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.success }}>
                    Rs {row.settled.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Bottom row: status + CTA */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: isSettled ? "#dcfce7" : hasOutstanding ? "#fff7ed" : colors.border + "40",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isSettled ? "#16a34a" : hasOutstanding ? "#9a3412" : colors.mutedForeground,
                    }}
                  >
                    {isSettled ? "✓ SETTLED" : hasOutstanding ? "PENDING" : "NO ACTIVITY"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>View Khata</Text>
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
