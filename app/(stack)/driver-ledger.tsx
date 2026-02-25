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
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../api/axiosInstance";
import useDrivers from "../../hooks/useDriver";
import { Skeleton } from "../../components/Skeleton";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function DriverLedgerScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { drivers, fetchDrivers, loading } = useDrivers();
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const showInitialSkeleton = loading && !refreshing && (drivers || []).length === 0;

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Driver Khata</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {showInitialSkeleton && (
          <View>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} width="100%" height={96} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {!loading && (drivers || []).length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>No drivers found.</Text>
        )}

        {(drivers || []).map((d) => {
          const bal = Number(balances[d._id] || 0);
          const isPositive = bal >= 0;

          return (
            <TouchableOpacity
              key={d._id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/driver-ledger-detail",
                  params: { driverId: d._id },
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
              {/* Top row: name + balance */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3 }}>
                    {d.driver_name || d.name || "Driver"}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: isPositive ? "#dcfce7" : "#fee2e2",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "800", color: isPositive ? "#16a34a" : "#dc2626" }}>
                    {isPositive ? "+" : "-"}Rs {Math.abs(bal).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Bottom row: phone + chevron */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="call-outline" size={13} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: "500" }}>
                    {d.contact_number || d.phone || "—"}
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
