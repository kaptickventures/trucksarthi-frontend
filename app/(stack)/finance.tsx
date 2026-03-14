import { Ionicons } from "@expo/vector-icons";
import { PieChart, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Skeleton } from "../../components/Skeleton";
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import { useTranslation } from "../../context/LanguageContext";

export default function FinanceScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { summary: metrics, fetchSummary, loading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const sections = [
    { title: "Transactions", description: "All entries", icon: "list-outline", color: colors.info, bg: colors.infoSoft, route: "/(stack)/transactions" },
    { title: "P&L Reports", description: "Client, driver, truck & misc", icon: "stats-chart-outline", color: colors.warning, bg: colors.warningSoft, route: "/(stack)/pl-reports" },
    { title: "Driver Khata", description: "Driver khata", icon: "people-outline", color: colors.success, bg: colors.successSoft, route: "/(stack)/driver-ledger" },
    { title: "Client Khata", description: "Client khata", icon: "business-outline", color: colors.info, bg: colors.infoSoft, route: "/(stack)/client-ledger" },
    { title: "Daily Khata", description: "Fuel, Fastag Recharge, Challan", icon: "speedometer-outline", color: colors.destructive, bg: colors.destructiveSoft, route: "/(stack)/daily-khata" },
    { title: "Maintenance Khata", description: "Document Expenses, Service & Repair", icon: "construct-outline", color: colors.warning, bg: colors.warningSoft, route: "/(stack)/maintenance-khata" },
    { title: "Misc Transactions", description: "Other entries", icon: "apps-outline", color: colors.destructive, bg: colors.destructiveSoft, route: "/(stack)/misc-transactions" },
  ];

  const balance = Number(metrics.income || 0) - Number(metrics.expense || 0);
  const showInitialSkeleton = loading && !refreshing;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('financeHub')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('manageFinanceSubtitle')}</Text>
        </View>

        {showInitialSkeleton ? (
          <>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <Skeleton height={96} style={{ flex: 1, borderRadius: 16 }} />
              <Skeleton height={96} style={{ flex: 1, borderRadius: 16 }} />
            </View>
            <Skeleton height={200} style={{ width: '100%', borderRadius: 16 }} />
          </>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <View style={{ padding: 6, backgroundColor: colors.successSoft, borderRadius: 20 }}>
                    <ArrowDownLeft size={16} color={colors.success} />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: "600" }}>Income</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
                  +Rs {(Number(metrics?.income) || 0).toLocaleString()}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <View style={{ padding: 6, backgroundColor: colors.destructiveSoft, borderRadius: 20 }}>
                    <ArrowUpRight size={16} color={colors.destructive} />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: "600" }}>Expense</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
                  -Rs {(Number(metrics?.expense) || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.primary, padding: 20, borderRadius: 20, marginBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: "600", marginBottom: 4, opacity: 0.8 }}>Balance</Text>
                <Text style={{ color: colors.primaryForeground, fontSize: 28, fontWeight: "bold" }}>
                  {balance >= 0 ? "+" : "-"}Rs {Math.abs(balance).toLocaleString()}
                </Text>
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: 10, borderRadius: 12 }}>
                <PieChart size={32} color={colors.primaryForeground} />
              </View>
            </View>
          </>
        )}

        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Modules</Text>
        <View style={{ gap: 10 }}>
          {sections.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
              style={{ backgroundColor: colors.card, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={2}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
