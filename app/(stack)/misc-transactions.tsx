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
import { Trash2 } from "lucide-react-native";
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import { formatDate, formatLabel } from "../../lib/utils";

const EXPENSE_CATEGORIES = ["DOCUMENT", "SERVICE", "REPAIR"];
const INCOME_CATEGORIES = ["ASSET_SALE", "SCRAP_SALE", "REFUND", "OTHER_INCOME"];

export default function MiscTransactionsScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { loading, transactions, fetchTransactions, addTransaction, deleteTransaction } = useFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [entryType, setEntryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");

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

  const confirmDelete = (id: string) => {
    Alert.alert("Delete", "Delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTransaction(id);
            await load();
          } catch { }
        },
      },
    ]);
  };
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
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Misc Transactions</Text>
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
              <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                <TouchableOpacity onPress={() => confirmDelete(String(item._id))} style={{ padding: 4 }}>
                  <Trash2 size={14} color={colors.destructive} />
                </TouchableOpacity>
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
              onPress={() => setEntryType("INCOME")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: entryType === "INCOME" ? colors.success : colors.border + '30',
                backgroundColor: entryType === "INCOME" ? colors.success : (isDark ? colors.card : colors.secondary + '40'),
                alignItems: "center",
              }}
            >
              <Text style={{ color: entryType === "INCOME" ? "white" : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEntryType("EXPENSE")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: entryType === "EXPENSE" ? colors.destructive : colors.border + '30',
                backgroundColor: entryType === "EXPENSE" ? colors.destructive : (isDark ? colors.card : colors.secondary + '40'),
                alignItems: "center",
              }}
            >
              <Text style={{ color: entryType === "EXPENSE" ? "white" : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>AMOUNT (₹)</Text>
          <TextInput
            placeholder="0"
            placeholderTextColor={colors.mutedForeground + '60'}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            className="rounded-2xl p-4 text-[24px] font-black text-center"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + '40',
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border + '30',
              height: 80,
              marginBottom: 24
            }}
          />



          {/* Payment Mode */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            {["CASH", "BANK", "UPI"].map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setPaymentMode(mode)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: paymentMode === mode ? colors.primary : colors.border + '30',
                  backgroundColor: paymentMode === mode ? colors.primary : (isDark ? colors.card : colors.secondary + '40'),
                  alignItems: "center"
                }}
              >
                <Text style={{ color: paymentMode === mode ? "white" : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>DETAILS</Text>
          <TextInput
            placeholder="e.g. Parts purchase or Client refund"
            placeholderTextColor={colors.mutedForeground + '60'}
            value={notes}
            onChangeText={setNotes}
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + '40',
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border + '30',
              marginBottom: 32,
              minHeight: 80
            }}
          />

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={submit}
              style={{ backgroundColor: colors.primary }}
              className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }} className="text-center font-black">SAVE ENTRY</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
