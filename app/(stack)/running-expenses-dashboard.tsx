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
import { Skeleton } from "../../components/Skeleton";
import FinanceFAB from "../../components/finance/FinanceFAB";
import BottomSheet from "../../components/BottomSheet";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate, formatLabel } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

const RUNNING_ACTIONS = ["FUEL", "FASTAG", "CHALLAN"] as const;

export default function RunningExpensesDashboardScreen() {
  const router = useRouter();
  const { truckId } = useLocalSearchParams<{ truckId?: string }>();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, addRunningExpense, loading: financeLoading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string>("FUEL");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<(typeof RUNNING_ACTIONS)[number] | "ALL">("ALL");
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
    () => activeCategoryFilter === "ALL" ? truckRows : truckRows.filter((t: any) => String(t?.transactionSubtype || t?.category || "") === activeCategoryFilter),
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-6 px-0 mt-5">
          <Text className="text-3xl font-black" style={{ color: colors.foreground }}>{selectedTruck?.registration_number || "Truck"} {t('runningExpenses')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Manage running expenses for this truck</Text>
        </View>

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

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {(["ALL", ...RUNNING_ACTIONS] as const).map((type) => (
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
              <Text style={{ color: activeCategoryFilter === type ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                {type === "FASTAG" ? "Fastag" : formatLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ledger Entries */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          {activeCategoryFilter === "ALL" ? "TRANSACTION" : formatLabel(activeCategoryFilter).toUpperCase()} HISTORY
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
            <Text style={{ color: colors.mutedForeground }}>No {activeCategoryFilter === "ALL" ? "running" : formatLabel(activeCategoryFilter).toLowerCase()} expenses found for this month.</Text>
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

      <FinanceFAB onPress={() => openAddModal(activeCategoryFilter === "ALL" ? "FUEL" : activeCategoryFilter)} />

      {/* Add Expense Modal */}
      <BottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Running Expense"
        subtitle={selectedTruck?.registration_number || "Vehicle"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Category selector */}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 10, letterSpacing: 0.5 }}>CATEGORY</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {RUNNING_ACTIONS.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setExpenseCategory(cat)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: expenseCategory === cat ? colors.primary : colors.border,
                  backgroundColor: expenseCategory === cat ? colors.primary : colors.card,
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
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 10, letterSpacing: 0.5 }}>AMOUNT (₹)</Text>
          <TextInput
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              color: colors.foreground,
              padding: 16,
              fontSize: 32,
              fontWeight: "900",
              marginBottom: 20,
              textAlign: "center",
              backgroundColor: isDark ? colors.card : colors.secondary + "10"
            }}
          />

          {/* Fuel specific fields */}
          {expenseCategory === "FUEL" && (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>LITRES</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={litres}
                  onChangeText={setLitres}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    color: colors.foreground,
                    padding: 14,
                    fontSize: 16,
                    fontWeight: "700",
                    backgroundColor: isDark ? colors.card : colors.secondary + "10"
                  }}
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
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    color: colors.foreground,
                    padding: 14,
                    fontSize: 16,
                    fontWeight: "700",
                    backgroundColor: isDark ? colors.card : colors.secondary + "10"
                  }}
                />
              </View>
            </View>
          )}

          {/* Payment Mode chips */}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 10, letterSpacing: 0.5 }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {["CASH", "BANK", "UPI"].map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setPaymentMode(mode)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: paymentMode === mode ? colors.primary : colors.border,
                  backgroundColor: paymentMode === mode ? colors.primary : colors.card,
                  alignItems: "center"
                }}
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
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              color: colors.foreground,
              padding: 16,
              fontSize: 15,
              marginBottom: 28,
              backgroundColor: isDark ? colors.card : colors.secondary + "10"
            }}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              style={{ flex: 1, padding: 18, borderRadius: 20, backgroundColor: colors.muted, alignItems: "center" }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              style={{ flex: 2, padding: 18, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 17 }}>{financeLoading ? "Saving..." : "Save Expense"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
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
