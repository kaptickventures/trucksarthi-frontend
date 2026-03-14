import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useClients from "../../hooks/useClient";
import { useClientLedger } from "../../hooks/useClientLedger";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

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
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { clients, fetchClients } = useClients();
  const { fetchSummary } = useClientLedger();

  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<ClientRow[]>([]);
  // true while clients are still loading or rows are being built
  const [isBuilding, setIsBuilding] = useState(true);

  const load = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsBuilding(true);
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
            if (b.unbilled !== a.unbilled) return b.unbilled - a.unbilled;
            return a.clientName.localeCompare(b.clientName);
          })
        );
        setIsBuilding(false);
      }
    };

    if (clients === undefined) {
      // still waiting for initial fetch
      return;
    } else if (clients.length > 0) {
      run();
    } else {
      // clients loaded but genuinely empty
      setRows([]);
      setIsBuilding(false);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('clientKhata')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('manageFinanceSubtitle')}</Text>
        </View>

        {/* Loading skeleton */}
        {isBuilding && rows.length === 0 && (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ width: 140, height: 18, backgroundColor: colors.muted, borderRadius: 6, opacity: 0.5 }} />
                  <View style={{ width: 60, height: 18, backgroundColor: colors.muted, borderRadius: 10, opacity: 0.4 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
                  <View style={{ width: 80, height: 14, backgroundColor: colors.muted, borderRadius: 4, opacity: 0.35 }} />
                  <View style={{ width: 80, height: 14, backgroundColor: colors.muted, borderRadius: 4, opacity: 0.35 }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state - only show after fully loaded */}
        {!isBuilding && rows.length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>No clients found.</Text>
        )}

        {rows.map((row) => {
          const hasOutstanding = row.unbilled > 0;

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
                    backgroundColor: hasOutstanding ? colors.destructiveSoft : colors.successSoft,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: hasOutstanding ? colors.destructive : colors.success,
                    }}
                  >
                    {hasOutstanding ? `-Rs ${row.unbilled.toLocaleString()} ${t('due') || 'due'}` : t('settled')}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 16, marginBottom: 10, alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{t('billed').toUpperCase()}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
                    Rs {row.billed.toLocaleString()}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{t('settled').toUpperCase()}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.success }}>
                    Rs {row.settled.toLocaleString()}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{(t('unbilled') || 'Unbilled').toUpperCase()}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: hasOutstanding ? colors.destructive : colors.mutedForeground }}>
                    Rs {row.unbilled.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>{t('viewKhata')}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
