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

const EXPENSE_CATEGORIES = ["OFFICE_EXPENSE", "FOOD_SNACKS", "ADMIN", "UTILITIES", "OTHER"];
const INCOME_CATEGORIES = ["ASSET_SALE", "SCRAP_SALE", "REFUND", "OTHER_INCOME"];

export default function MiscTransactionsScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { loading, transactions, fetchTransactions, addTransaction } = useFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [entryType, setEntryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  const load = useCallback(async () => {
    await fetchTransactions({
      sourceModule: "MISC",
      direction: activeFilter === "ALL" ? "" : activeFilter,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date().toISOString(),
    });
  }, [fetchTransactions, activeFilter]);

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
    await load();
  };

  const summary = useMemo(() => {
    const income = (transactions || [])
      .filter((t: any) => t.sourceModule === "MISC" && t.direction === "INCOME")
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const expense = (transactions || [])
      .filter((t: any) => t.sourceModule === "MISC" && t.direction === "EXPENSE")
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const categoryOptions = entryType === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 19, fontWeight: "700", color: colors.foreground }}>Misc Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <SummaryCard label="Income" value={summary.income} color={colors.success} />
          <SummaryCard label="Expense" value={summary.expense} color={colors.destructive} />
          <SummaryCard label="Net" value={summary.net} color={summary.net >= 0 ? colors.success : colors.destructive} />
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>QUICK ADD</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <ToggleButton label="Add Expense" active={entryType === "EXPENSE"} onPress={() => setEntryType("EXPENSE")} />
            <ToggleButton label="Add Income" active={entryType === "INCOME"} onPress={() => setEntryType("INCOME")} />
          </View>

          <TextInput
            placeholder="Amount"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10 }}
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {categoryOptions.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: category === cat ? colors.primary : colors.border, backgroundColor: category === cat ? colors.primary : "transparent" }}
                >
                  <Text style={{ color: category === cat ? "white" : colors.foreground, fontSize: 11, fontWeight: "700" }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TextInput
            placeholder="Payment mode (CASH/BANK/UPI)"
            placeholderTextColor={colors.mutedForeground}
            value={paymentMode}
            onChangeText={setPaymentMode}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Notes"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 12 }}
          />

          <TouchableOpacity onPress={submit} style={{ backgroundColor: colors.primary, padding: 13, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ color: "white", fontWeight: "800" }}>Save Entry</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>LEDGER VIEW</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {["ALL", "EXPENSE", "INCOME"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f as any)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: activeFilter === f ? colors.primary : colors.border, backgroundColor: activeFilter === f ? colors.primary : "transparent" }}
              >
                <Text style={{ color: activeFilter === f ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(transactions || [])
            .filter((t: any) => t.sourceModule === "MISC")
            .map((item: any) => {
              const isIncome = item.direction === "INCOME";
              return (
                <View key={item._id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "700" }}>{item.category}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{item.notes || "-"}</Text>
                    </View>
                    <Text style={{ color: isIncome ? colors.success : colors.destructive, fontWeight: "800" }}>
                      {isIncome ? "+" : "-"}₹{Number(item.amount || 0).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                    {formatDate(item.date)} | {item.paymentMode || "-"}
                  </Text>
                </View>
              );
            })}

          {!loading && (!transactions || transactions.filter((t: any) => t.sourceModule === "MISC").length === 0) && (
            <View style={{ alignItems: "center", marginTop: 14 }}>
              <Text style={{ color: colors.mutedForeground }}>No misc entries found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useThemeStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : "transparent",
      }}
    >
      <Text style={{ color: active ? "white" : colors.foreground, fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
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
