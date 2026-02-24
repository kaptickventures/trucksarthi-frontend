import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import FinanceFAB from "../../components/finance/FinanceFAB";
import QuickActionButton from "../../components/finance/QuickActionButton";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate, formatLabel } from "../../lib/utils";

const RUNNING_ACTIONS = ["FUEL", "FASTAG_RECHARGE", "CHALLAN"] as const;

export default function RunningExpensesDashboardScreen() {
  const router = useRouter();
  const { truckId } = useLocalSearchParams<{ truckId?: string }>();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, addRunningExpense, loading: financeLoading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string>("FUEL");
  const [amount, setAmount] = useState("");
  const [litres, setLitres] = useState("");
  const [kmReading, setKmReading] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");

  const selectedTruck = useMemo(() => (trucks || []).find((t: any) => String(t._id) === String(truckId)), [trucks, truckId]);
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), []);

  const loadData = useCallback(async () => {
    if (!truckId) return;
    await Promise.all([
      fetchTrucks(),
      fetchTransactions({
        startDate: monthStart,
        endDate: new Date().toISOString(),
        direction: "EXPENSE",
        sourceModule: "RUNNING_EXPENSE",
        truckId,
      }),
    ]);
  }, [fetchTrucks, fetchTransactions, monthStart, truckId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const truckRows = useMemo(() => {
    const rows = (transactions || []).filter(
      (t: any) =>
        String(t?.truckId || "") === String(truckId) &&
        RUNNING_ACTIONS.includes(String(t?.transactionSubtype || t?.category || "") as any)
    );
    return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, truckId]);

  const monthlyExpense = useMemo(() => truckRows.reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0), [truckRows]);
  const fuelExpense = useMemo(
    () => truckRows.filter((t: any) => t?.transactionSubtype === "FUEL" || t?.category === "FUEL").reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0),
    [truckRows]
  );

  const onSave = async () => {
    if (!truckId) {
      Alert.alert("Truck Required", "Select a truck.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }
    if (expenseCategory === "FUEL" && (!litres || !kmReading)) {
      Alert.alert("Missing Fields", "Fuel needs litres and KM.");
      return;
    }

    await addRunningExpense({
      truckId,
      category: expenseCategory,
      amount: Number(amount),
      paymentMode,
      notes,
      date: new Date().toISOString(),
      ...(expenseCategory === "FUEL" ? { litres: Number(litres), kmReading: Number(kmReading) } : {}),
    });

    setShowAdd(false);
    setAmount("");
    setLitres("");
    setKmReading("");
    setNotes("");
    setPaymentMode("CASH");
    await loadData();
  };

  const openAddModal = (cat: string) => {
    setExpenseCategory(cat);
    setShowAdd(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>
          {selectedTruck?.registration_number || "Truck"} Running
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Summary Info Header */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5 }}>
            MONTHLY SUMMARY
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View>
              <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}>
                Rs {monthlyExpense.toLocaleString()}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                Total running costs
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ backgroundColor: "#fff7ed", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: "#ea580c", fontSize: 13, fontWeight: "800" }}>
                  Rs {fuelExpense.toLocaleString()} Fuel
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          QUICK ADD
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 10 }}>
          {RUNNING_ACTIONS.map((action) => (
            <QuickActionButton key={action} label={formatLabel(action)} onPress={() => openAddModal(action)} />
          ))}
        </ScrollView>

        {/* Ledger Entries */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          EXPENSE HISTORY
        </Text>

        {truckRows.length === 0 && !financeLoading && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 30, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground }}>No expenses found for this month.</Text>
          </View>
        )}

        {truckRows.map((item: any) => {
          const type = String(item.transactionSubtype || item.category || "Expense").toUpperCase();
          const isFuel = type === "FUEL";

          return (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: isFuel ? "#fff7ed" : colors.border + "50",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: isFuel ? "#ea580c" : colors.mutedForeground,
                        }}
                      >
                        {formatLabel(type).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>{item.paymentMode || "Cash"}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>
                    {item.notes || formatLabel(type)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{formatDate(item.date)}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.destructive }}>
                  -Rs {Number(item.amount || 0).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FinanceFAB onPress={() => openAddModal("FUEL")} />

      {/* Add Expense Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <KeyboardAwareScrollView enableOnAndroid keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: colors.background,
                paddingTop: 12,
                paddingHorizontal: 20,
                paddingBottom: 32,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              {/* Drag handle */}
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>

              <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18, marginBottom: 16 }}>Add Running Expense</Text>

              {/* Truck Info Chip */}
              <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: colors.primary + "20", marginBottom: 20 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{selectedTruck?.registration_number || "-"}</Text>
              </View>

              {/* Category selector */}
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>CATEGORY</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {RUNNING_ACTIONS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setExpenseCategory(cat)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: expenseCategory === cat ? colors.primary : colors.border,
                      backgroundColor: expenseCategory === cat ? colors.primary : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: expenseCategory === cat ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>{formatLabel(cat)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>AMOUNT (₹)</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.foreground, padding: 14, fontSize: 24, fontWeight: "800", marginBottom: 16, textAlign: "center" }}
              />

              {/* Fuel specific fields */}
              {expenseCategory === "FUEL" && (
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>LITRES</Text>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      value={litres}
                      onChangeText={setLitres}
                      style={inputStyle(colors)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>KM READING</Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      value={kmReading}
                      onChangeText={setKmReading}
                      style={inputStyle(colors)}
                    />
                  </View>
                </View>
              )}

              {/* Payment Mode chips */}
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>PAYMENT MODE</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {["CASH", "BANK", "UPI"].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setPaymentMode(mode)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: paymentMode === mode ? colors.primary : colors.border, backgroundColor: paymentMode === mode ? colors.primary : "transparent", alignItems: "center" }}
                  >
                    <Text style={{ color: paymentMode === mode ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>{mode}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                placeholder="Remarks (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.foreground, padding: 12, fontSize: 14, marginBottom: 20 }}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSave} style={{ flex: 2, padding: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center" }}>
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>{financeLoading ? "Saving..." : "Save Expense"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function inputStyle(colors: any) {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.foreground,
    padding: 12,
    fontSize: 14,
  };
}
