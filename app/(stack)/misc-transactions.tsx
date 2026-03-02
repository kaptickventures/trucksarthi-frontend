import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import { formatDate, formatLabel } from "../../lib/utils";

const EXPENSE_CATEGORIES = ["DOCUMENT", "SERVICE", "REPAIR"];
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

  const categoryOptions = entryType === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const totals = useMemo(() => {
    return (transactions || []).reduce(
      (acc, t: any) => {
        if (t.direction === "INCOME") acc.income += Number(t.amount || 0);
        if (t.direction === "EXPENSE") acc.expense += Number(t.expense_amount || t.amount || 0);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let rows = (transactions || []).filter((t: any) => t.sourceModule === "MISC");
    if (activeFilter !== "ALL") {
      rows = rows.filter((t: any) => t.direction === activeFilter);
    }
    return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, activeFilter]);
  const showInitialSkeleton = loading && !refreshing && filteredTransactions.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-6 px-0 mt-5">
          <Text className="text-3xl font-black" style={{ color: colors.foreground }}>Misc Transactions</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>View and manage other entries</Text>
        </View>

        {/* Summary Info */}
        {showInitialSkeleton ? (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <Skeleton style={{ flex: 1, height: 75, borderRadius: 16 }} />
            <Skeleton style={{ flex: 1, height: 75, borderRadius: 16 }} />
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>INCOME</Text>
              <Text style={{ color: colors.success, fontSize: 18, fontWeight: "800" }}>
                Rs {totals.income.toLocaleString()}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>EXPENSE</Text>
              <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: "800" }}>
                Rs {totals.expense.toLocaleString()}
              </Text>
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

      <BottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Transaction"
        subtitle="Manage miscellaneous entries"
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Type Toggle */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setEntryType("EXPENSE")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: entryType === "EXPENSE" ? colors.destructive : colors.border,
                backgroundColor: entryType === "EXPENSE" ? colors.destructive : colors.card,
                alignItems: "center",
              }}
            >
              <Text style={{ color: entryType === "EXPENSE" ? "white" : colors.foreground, fontWeight: "700", fontSize: 13 }}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEntryType("INCOME")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: entryType === "INCOME" ? colors.success : colors.border,
                backgroundColor: entryType === "INCOME" ? colors.success : colors.card,
                alignItems: "center",
              }}
            >
              <Text style={{ color: entryType === "INCOME" ? "white" : colors.foreground, fontWeight: "700", fontSize: 13 }}>Income</Text>
            </TouchableOpacity>
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
              marginBottom: 24,
              textAlign: "center",
              backgroundColor: isDark ? colors.card : colors.secondary + "10"
            }}
          />

          {/* Category selector */}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 12, letterSpacing: 0.5 }}>CATEGORY</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            {categoryOptions.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: category === cat ? colors.primary : colors.border,
                  backgroundColor: category === cat ? colors.primary : colors.card,
                }}
              >
                <Text style={{ color: category === cat ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                  {formatLabel(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment Mode */}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 12, letterSpacing: 0.5 }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            {["CASH", "BANK", "UPI"].map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setPaymentMode(mode)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: paymentMode === mode ? colors.primary : colors.border,
                  backgroundColor: paymentMode === mode ? colors.primary : colors.card,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: paymentMode === mode ? "white" : colors.foreground, fontWeight: "700", fontSize: 12 }}>{mode}</Text>
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
              borderRadius: 16,
              color: colors.foreground,
              padding: 16,
              fontSize: 15,
              marginBottom: 32,
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
              onPress={submit}
              style={{ flex: 2, padding: 18, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 17 }}>{loading ? "Saving..." : "Save Entry"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
