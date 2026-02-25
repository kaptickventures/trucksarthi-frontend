import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { Skeleton } from "../../components/Skeleton";
import FinanceFAB from "../../components/finance/FinanceFAB";
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import { formatDate, formatLabel } from "../../lib/utils";

const EXPENSE_CATEGORIES = ["OFFICE_EXPENSE", "FOOD_SNACKS", "ADMIN", "UTILITIES", "OTHER"];
const INCOME_CATEGORIES = ["ASSET_SALE", "SCRAP_SALE", "REFUND", "OTHER_INCOME"];

export default function MiscTransactionsScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { loading, transactions, fetchTransactions, addTransaction } = useFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [entryType, setEntryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), []);

  const load = useCallback(async () => {
    await fetchTransactions({
      sourceModule: "MISC",
      direction: activeFilter === "ALL" ? "" : activeFilter,
      startDate: monthStart,
      endDate: new Date().toISOString(),
    });
  }, [fetchTransactions, activeFilter, monthStart]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCategory(entryType === "EXPENSE" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  }, [entryType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    await addTransaction({
      sourceModule: "MISC",
      direction: entryType,
      category,
      paymentMode,
      amount: Number(amount),
      notes,
      date: new Date().toISOString(),
    });

    setAmount("");
    setNotes("");
    setShowAdd(false);
    await load();
  };

  const summary = useMemo(() => {
    const income = (transactions || [])
      .filter((t: any) => t.sourceModule === "MISC" && t.direction === "INCOME")
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const expense = (transactions || [])
      .filter((t: any) => t.sourceModule === "MISC" && t.direction === "EXPENSE")
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    return { income, expense };
  }, [transactions]);

  const categoryOptions = entryType === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const filteredTransactions = useMemo(() => {
    let rows = (transactions || []).filter((t: any) => t.sourceModule === "MISC");
    if (activeFilter !== "ALL") {
      rows = rows.filter((t: any) => t.direction === activeFilter);
    }
    return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, activeFilter]);
  const showInitialSkeleton = loading && !refreshing && filteredTransactions.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Misc Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Summary Info */}
        {showInitialSkeleton ? (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <Skeleton style={{ flex: 1, height: 74, borderRadius: 16 }} />
            <Skeleton style={{ flex: 1, height: 74, borderRadius: 16 }} />
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>INCOME</Text>
              <Text style={{ color: colors.success, fontSize: 16, fontWeight: "800" }}>+Rs {summary.income.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>EXPENSE</Text>
              <Text style={{ color: colors.destructive, fontSize: 16, fontWeight: "800" }}>-Rs {summary.expense.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Filter Pills */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {["ALL", "EXPENSE", "INCOME"].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f as any)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: activeFilter === f ? colors.primary : colors.border,
                backgroundColor: activeFilter === f ? colors.primary : "transparent",
              }}
            >
              <Text style={{ color: activeFilter === f ? "white" : colors.foreground, fontWeight: "700", fontSize: 12 }}>
                {formatLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          RECENT TRANSACTIONS
        </Text>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} width="100%" height={88} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {!showInitialSkeleton && filteredTransactions.map((item: any) => {
          const isIncome = item.direction === "INCOME";
          return (
            <View
              key={item._id}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
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
                        backgroundColor: isIncome ? "#dcfce7" : "#fee2e2",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: isIncome ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {formatLabel(item.category).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>
                      {item.paymentMode || "Cash"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>
                    {item.notes || formatLabel(item.category)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "800", color: isIncome ? colors.success : colors.destructive }}>
                  {isIncome ? "+" : "-"}Rs {Number(item.amount || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}

        {!loading && filteredTransactions.length === 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 30, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground }}>No transactions found.</Text>
          </View>
        )}
      </ScrollView>

      <FinanceFAB onPress={() => setShowAdd(true)} />

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          >
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

              <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18, marginBottom: 16 }}>
                Add Transaction
              </Text>

              {/* Type Toggle */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setEntryType("EXPENSE")}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: entryType === "EXPENSE" ? colors.destructive : colors.border,
                    backgroundColor: entryType === "EXPENSE" ? colors.destructive : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: entryType === "EXPENSE" ? "white" : colors.foreground, fontWeight: "700" }}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEntryType("INCOME")}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: entryType === "INCOME" ? colors.success : colors.border,
                    backgroundColor: entryType === "INCOME" ? colors.success : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: entryType === "INCOME" ? "white" : colors.foreground, fontWeight: "700" }}>Income</Text>
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>
                AMOUNT (₹)
              </Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  color: colors.foreground,
                  padding: 14,
                  fontSize: 24,
                  fontWeight: "800",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              />

              {/* Category chips */}
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>
                CATEGORY
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {categoryOptions.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: category === cat ? colors.primary : colors.border,
                        backgroundColor: category === cat ? colors.primary : "transparent",
                      }}
                    >
                      <Text style={{ color: category === cat ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                        {formatLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Payment Mode */}
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>
                PAYMENT MODE
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {["CASH", "BANK", "UPI"].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setPaymentMode(mode)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: paymentMode === mode ? colors.primary : colors.border,
                      backgroundColor: paymentMode === mode ? colors.primary : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: paymentMode === mode ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                placeholder="Remarks/Notes"
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  color: colors.foreground,
                  padding: 12,
                  marginBottom: 24,
                }}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowAdd(false)}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submit}
                  style={{
                    flex: 2,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
                    {loading ? "Saving..." : "Save Entry"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
