import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../../components/Skeleton";
import FinanceFAB from "../../components/finance/FinanceFAB";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate, formatLabel } from "../../lib/utils";

const RUNNING_ACTIONS = ["FUEL", "FASTAG", "CHALLAN"] as const;

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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<(typeof RUNNING_ACTIONS)[number]>("FUEL");
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

  const filteredTruckRows = useMemo(
    () => truckRows.filter((t: any) => String(t?.transactionSubtype || t?.category || "") === activeCategoryFilter),
    [truckRows, activeCategoryFilter]
  );

  const monthlyExpense = useMemo(() => truckRows.reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0), [truckRows]);
  const totalsByType = useMemo(
    () =>
      RUNNING_ACTIONS.reduce(
        (acc, type) => {
          acc[type] = truckRows
            .filter((t: any) => String(t?.transactionSubtype || t?.category || "") === type)
            .reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0);
          return acc;
        },
        { FUEL: 0, FASTAG: 0, CHALLAN: 0 } as Record<(typeof RUNNING_ACTIONS)[number], number>
      ),
    [truckRows]
  );
  const showInitialSkeleton = financeLoading && !refreshing && filteredTruckRows.length === 0;

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
                  Rs {totalsByType.FUEL.toLocaleString()} Fuel
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {RUNNING_ACTIONS.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setActiveCategoryFilter(type)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: activeCategoryFilter === type ? colors.primary : colors.border,
                backgroundColor: activeCategoryFilter === type ? colors.primary : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: activeCategoryFilter === type ? "white" : colors.foreground, fontWeight: "700", fontSize: 12 }}>
                {type === "FASTAG" ? "Fastag" : formatLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {RUNNING_ACTIONS.map((type) => (
            <View key={`card-${type}`} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>
                {type === "FASTAG" ? "FASTAG" : type}
              </Text>
              <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: "800" }}>
                Rs {totalsByType[type].toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Ledger Entries */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          {formatLabel(activeCategoryFilter).toUpperCase()} HISTORY
        </Text>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} width="100%" height={86} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {filteredTruckRows.length === 0 && !financeLoading && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 30, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground }}>No {formatLabel(activeCategoryFilter).toLowerCase()} expenses found for this month.</Text>
          </View>
        )}

        {!showInitialSkeleton && filteredTruckRows.map((item: any) => {
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

      <FinanceFAB onPress={() => openAddModal(activeCategoryFilter)} />

      {/* Add Expense Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <Pressable style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} onPress={() => setShowAdd(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View
              style={{
                maxHeight: "88%",
                backgroundColor: colors.background,
                paddingTop: 12,
                paddingHorizontal: 20,
                paddingBottom: 32,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <ScrollView keyboardShouldPersistTaps="handled">
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
                    <Text style={{ color: expenseCategory === cat ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                      {cat === "FASTAG" ? "Fastag" : formatLabel(cat)}
                    </Text>
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
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
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
