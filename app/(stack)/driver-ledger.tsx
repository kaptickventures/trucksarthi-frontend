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
import useDrivers from "../../hooks/useDriver";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function DriverLedgerScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { drivers, fetchDrivers } = useDrivers();
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    await fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const run = async () => {
      const next: Record<string, number> = {};
      await Promise.all(
        (drivers || []).map(async (d) => {
          try {
            const res = await API.get(`/api/driver-ledger/driver/${d._id}/balance`);
            next[d._id] = Number(res.data?.balance || 0);
          } catch {
            next[d._id] = 0;
          }
        })
      );
      setBalances(next);
    };
    if (drivers?.length) run();
  }, [drivers]);

  const summary = useMemo(() => {
    const values = Object.values(balances);
    const total = values.reduce((a, b) => a + b, 0);
    return { drivers: (drivers || []).length, total };
  }, [balances, drivers]);

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Driver Ledger</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <SummaryCard label="Drivers" value={summary.drivers.toLocaleString()} />
          <SummaryCard label="Net Balance" value={`₹${summary.total.toLocaleString()}`} />
        </View>

        {(drivers || []).map((d) => {
          const bal = Number(balances[d._id] || 0);
          return (
            <TouchableOpacity
              key={d._id}
              onPress={() => router.push({ pathname: "/(stack)/driver-ledger-detail", params: { driverId: d._id } })}
              style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>{d.driver_name || d.name || "Driver"}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{d.contact_number || d.phone || "-"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: bal >= 0 ? colors.success : colors.destructive, fontWeight: "800" }}>
                    ₹{Math.abs(bal).toLocaleString()}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{bal >= 0 ? "Credit" : "Debit"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
