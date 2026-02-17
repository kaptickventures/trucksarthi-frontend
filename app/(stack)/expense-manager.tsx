import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

type ExpenseTab = "FUEL" | "FASTAG_RECHARGE" | "LOADING" | "UNLOADING" | "CHALLAN" | "MAINTENANCE";

const QUICK_TABS: ExpenseTab[] = ["FUEL", "FASTAG_RECHARGE", "LOADING", "UNLOADING", "CHALLAN", "MAINTENANCE"];
const MAINTENANCE_TYPES = ["SERVICE", "REPAIR", "DOCUMENT"];

export default function ExpenseManagerScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { loading, transactions, fetchTransactions, addRunningExpense, addMaintenanceExpense } = useFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ExpenseTab>("FUEL");
  const [formData, setFormData] = useState({
    amount: "",
    litres: "",
    kmReading: "",
    notes: "",
    paymentMode: "CASH",
    maintenanceType: "SERVICE",
  });

  const loadExpenses = useCallback(async () => {
    await fetchTransactions({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date().toISOString(),
      direction: "EXPENSE",
      sourceModule: "RUNNING_EXPENSE,MAINTENANCE",
    });
  }, [fetchTransactions]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }, [loadExpenses]);

  const resetForm = () => {
    setFormData({
      amount: "",
      litres: "",
      kmReading: "",
      notes: "",
      paymentMode: formData.paymentMode || "CASH",
      maintenanceType: "SERVICE",
    });
  };

  const submit = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    if (activeTab === "FUEL" && (!formData.litres || !formData.kmReading)) {
      Alert.alert("Missing Fields", "Fuel requires litres and KM reading.");
      return;
    }

    if (activeTab === "MAINTENANCE") {
      await addMaintenanceExpense({
        category: formData.maintenanceType,
        serviceType: formData.maintenanceType,
        amount: Number(formData.amount),
        paymentMode: formData.paymentMode,
        notes: formData.notes,
        date: new Date().toISOString(),
      });
    } else {
      await addRunningExpense({
        category: activeTab,
        amount: Number(formData.amount),
        paymentMode: formData.paymentMode,
        notes: formData.notes,
        date: new Date().toISOString(),
        ...(activeTab === "FUEL"
          ? { litres: Number(formData.litres), kmReading: Number(formData.kmReading) }
          : {}),
      });
    }

    resetForm();
    await loadExpenses();
    Alert.alert("Saved", "Expense entry added.");
  };

  const monthlyTotals = useMemo(() => {
    const rows = transactions || [];
    const running = rows
      .filter((t: any) => t.sourceModule === "RUNNING_EXPENSE")
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const fuel = rows
      .filter((t: any) => t.transactionSubtype === "FUEL")
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const maintenance = rows
      .filter((t: any) => t.sourceModule === "MAINTENANCE")
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    return { running, fuel, maintenance };
  }, [transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Expense Manager</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <SummaryCard label="Running" value={monthlyTotals.running} color={colors.foreground} />
          <SummaryCard label="Fuel" value={monthlyTotals.fuel} color={colors.destructive} />
          <SummaryCard label="Maintenance" value={monthlyTotals.maintenance} color={colors.foreground} />
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>QUICK ADD</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {QUICK_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: activeTab === tab ? colors.primary : colors.border,
                  backgroundColor: activeTab === tab ? colors.primary : "transparent",
                }}
              >
                <Text style={{ color: activeTab === tab ? "white" : colors.foreground, fontSize: 11, fontWeight: "700" }}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Amount"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={formData.amount}
            onChangeText={(t) => setFormData((p) => ({ ...p, amount: t }))}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10 }}
          />

          {activeTab === "FUEL" && (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <TextInput
                placeholder="Litres"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={formData.litres}
                onChangeText={(t) => setFormData((p) => ({ ...p, litres: t }))}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
              />
              <TextInput
                placeholder="KM Reading"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={formData.kmReading}
                onChangeText={(t) => setFormData((p) => ({ ...p, kmReading: t }))}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
              />
            </View>
          )}

          {activeTab === "MAINTENANCE" && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              {MAINTENANCE_TYPES.map((mt) => (
                <TouchableOpacity
                  key={mt}
                  onPress={() => setFormData((p) => ({ ...p, maintenanceType: mt }))}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: formData.maintenanceType === mt ? colors.primary : colors.border,
                    backgroundColor: formData.maintenanceType === mt ? colors.primary : "transparent",
                  }}
                >
                  <Text style={{ color: formData.maintenanceType === mt ? "white" : colors.foreground, fontSize: 11, fontWeight: "700" }}>{mt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            placeholder="Payment mode (CASH/BANK/UPI)"
            placeholderTextColor={colors.mutedForeground}
            value={formData.paymentMode}
            onChangeText={(t) => setFormData((p) => ({ ...p, paymentMode: t }))}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10 }}
          />

          <TextInput
            placeholder="Notes"
            placeholderTextColor={colors.mutedForeground}
            value={formData.notes}
            onChangeText={(t) => setFormData((p) => ({ ...p, notes: t }))}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 12 }}
          />

          <TouchableOpacity
            onPress={submit}
            style={{ backgroundColor: colors.primary, padding: 13, borderRadius: 10, alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>{loading ? "Saving..." : "Save Entry"}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>RECENT ENTRIES</Text>
          {(transactions || []).slice(0, 20).map((item: any) => (
            <View key={item._id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>{item.category}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {item.transactionSubtype || item.sourceModule}
                  </Text>
                </View>
                <Text style={{ color: colors.destructive, fontWeight: "800" }}>
                  -₹{Number(item.amount || 0).toLocaleString()}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                {formatDate(item.date)} | {item.paymentMode || "-"}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
      <Text style={{ color, fontWeight: "800" }}>₹{Number(value || 0).toLocaleString()}</Text>
    </View>
  );
}
