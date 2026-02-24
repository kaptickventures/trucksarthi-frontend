import { Ionicons } from "@expo/vector-icons";
import { PieChart, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { useNavigation, useRouter } from "expo-router";
import { useState, useCallback, useEffect, useLayoutEffect } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, StatusBar } from "react-native";
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import FinanceFAB from "../../components/finance/FinanceFAB";

export default function FinanceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { summary: metrics, fetchSummary } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
      headerTitleStyle: { color: colors.foreground, fontWeight: "800", fontSize: 22 },
      headerTintColor: colors.foreground,
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/(stack)/notifications" as any)} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const sections = [
    { title: "Transactions", description: "All entries", icon: "list-outline", color: "#3b82f6", route: "/(stack)/transactions" },
    { title: "Driver Khata", description: "Driver khata", icon: "people-outline", color: "#f59e0b", route: "/(stack)/driver-ledger" },
    { title: "Client Khata", description: "Client khata", icon: "business-outline", color: "#10b981", route: "/(stack)/client-ledger" },
    { title: "Running Expenses", description: "Fuel, Fastag Recharge, Challan", icon: "speedometer-outline", color: "#ef4444", route: "/(stack)/running-expenses" },
    { title: "Maintenance Khata", description: "Document Expenses, Service & Repair", icon: "construct-outline", color: "#0f766e", route: "/(stack)/maintenance-khata" },
    { title: "Misc Transactions", description: "Other entries", icon: "apps-outline", color: "#f97316", route: "/(stack)/misc-transactions" },
  ];

  const balance = Number(metrics.income || 0) - Number(metrics.expense || 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ marginBottom: 24, paddingHorizontal: 4, marginTop: 8 }}>
          <Text style={{ fontSize: 30, fontWeight: "900", color: colors.foreground }}>Finance Hub</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <View style={{ padding: 6, backgroundColor: "#dcfce7", borderRadius: 20 }}>
                <ArrowDownLeft size={16} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: "600" }}>Income</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>+Rs {metrics.income.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <View style={{ padding: 6, backgroundColor: "#fee2e2", borderRadius: 20 }}>
                <ArrowUpRight size={16} color="#dc2626" />
              </View>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: "600" }}>Expense</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>-Rs {metrics.expense.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.primary, padding: 20, borderRadius: 20, marginBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", marginBottom: 4 }}>Balance</Text>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>{balance >= 0 ? "+" : "-"}Rs {Math.abs(balance).toLocaleString()}</Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: 10, borderRadius: 12 }}>
            <PieChart size={32} color="white" />
          </View>
        </View>

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
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${item.color}20`, alignItems: "center", justifyContent: "center" }}>
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
      <FinanceFAB onPress={() => router.push("/(stack)/misc-transactions" as any)} />
    </View>
  );
}
