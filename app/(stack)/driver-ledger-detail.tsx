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
import useDrivers from "../../hooks/useDriver";
import useDriverFinance, { TransactionNature } from "../../hooks/useDriverFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

type TabType = "ALL" | "TO_DRIVER" | "DRIVER_SPENDS";
type QuickType = "ADVANCE" | "EXPENSE";

import BottomSheet from "../../components/BottomSheet";

export default function DriverLedgerDetailScreen() {
  const router = useRouter();
  const { driverId } = useLocalSearchParams<{ driverId?: string | string[] }>();
  const id = Array.isArray(driverId) ? driverId[0] : driverId;
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { drivers, fetchDrivers, loading: driversLoading } = useDrivers();
  const { entries, loading, fetchDriverLedger, addLedgerEntry } = useDriverFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [quickType, setQuickType] = useState<QuickType>("ADVANCE");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");

  const driver = useMemo(() => (drivers || []).find((d) => d._id === id), [drivers, id]);

  const load = useCallback(async () => {
    if (!id) return;
    await Promise.all([fetchDrivers(), fetchDriverLedger(id)]);
  }, [id, fetchDrivers, fetchDriverLedger]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const normalized = useMemo(() => {
    return [...(entries || [])]
      .map((entry: any) => {
        const transactionNature = String(entry?.transaction_nature || "").toLowerCase();
        const title = String(entry?.title || "").toLowerCase();

        const isToDriver = transactionNature === "received_by_driver" || title.includes("owner_to_driver");

        return {
          ...entry,
          entryDate: entry?.entry_date || entry?.createdAt || entry?.date,
          type: isToDriver ? "TO_DRIVER" : "DRIVER_SPENDS",
          amount: Number(entry?.amount || 0),
        };
      })
      .sort((a: any, b: any) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [entries, id]);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return normalized;
    return normalized.filter((entry: any) => entry.type === activeTab);
  }, [normalized, activeTab]);

  const totals = useMemo(() => {
    const advances = normalized
      .filter((entry: any) => entry.type === "TO_DRIVER")
      .reduce((sum: number, entry: any) => sum + entry.amount, 0);
    const expenses = normalized
      .filter((entry: any) => entry.type === "DRIVER_SPENDS")
      .reduce((sum: number, entry: any) => sum + entry.amount, 0);

    return {
      advances,
      expenses,
      balance: advances - expenses,
    };
  }, [normalized]);
  const showInitialSkeleton = (loading || driversLoading) && !refreshing && filtered.length === 0;

  const submitQuickAdd = async () => {
    if (!id) return;
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    const transactionNature: TransactionNature = quickType === "ADVANCE" ? "received_by_driver" : "paid_by_driver";
    const remark = `${quickType} | ${purpose || "General"} | ${paymentMode}`;

    await addLedgerEntry({
      driver_id: id,
      transaction_nature: transactionNature,
      counterparty_type: "owner",
      direction: transactionNature === "paid_by_driver" ? "to" : "from",
      amount: Number(amount),
      remarks: remark,
    });

    setShowAdd(false);
    setAmount("");
    setPurpose("");
    setPaymentMode("CASH");
    await load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-6 px-0 mt-5">
          <Text className="text-3xl font-black" style={{ color: colors.foreground }}>{driver?.driver_name || driver?.name || "Driver"} {t('khata')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Track and manage driver ledger entries</Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>
            {driver?.driver_name || driver?.name || "Driver"}
          </Text>
          <Text style={{ color: colors.mutedForeground, marginTop: 2, fontSize: 13 }}>
            {driver?.contact_number || driver?.phone || "-"}
          </Text>
          <Text style={{ color: totals.balance >= 0 ? colors.success : colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 18 }}>
            Net Balance: {totals.balance >= 0 ? "+" : "-"}Rs {Math.abs(totals.balance).toLocaleString()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <SummaryCard label="Advances" value={totals.advances} tone="green" />
          <SummaryCard label="Expenses" value={totals.expenses} tone="red" />
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {([
            { id: "ALL", label: "All" },
            { id: "TO_DRIVER", label: "To Driver" },
            { id: "DRIVER_SPENDS", label: "Driver Spends" },
          ] as { id: TabType; label: string }[]).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: activeTab === tab.id ? colors.primary : colors.border,
                backgroundColor: activeTab === tab.id ? colors.primary : "transparent",
                paddingVertical: 9,
                alignItems: "center",
              }}
            >
              <Text style={{ color: activeTab === tab.id ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
          {showInitialSkeleton && (
            <View>
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} width="100%" height={58} borderRadius={10} style={{ marginBottom: 10 }} />
              ))}
            </View>
          )}

          {!showInitialSkeleton && filtered.map((entry: any) => {
            const isToDriver = entry.type === "TO_DRIVER";
            return (
              <View key={entry._id} style={{ borderTopWidth: entry === filtered[0] ? 0 : 1, borderTopColor: colors.border, paddingTop: entry === filtered[0] ? 0 : 10, marginTop: entry === filtered[0] ? 0 : 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                      {isToDriver ? "Advance To Driver" : "Driver Spend"}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {entry.remarks || "-"}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                      {formatDate(entry.entryDate)}
                    </Text>
                  </View>
                  <Text style={{ color: isToDriver ? colors.success : colors.destructive, fontWeight: "800" }}>
                    {isToDriver ? "+" : "-"}Rs {entry.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}

          {!showInitialSkeleton && filtered.length === 0 && <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 10 }}>No ledger entries found.</Text>}
        </View>
      </ScrollView>

      <FinanceFAB onPress={() => setShowAdd(true)} />

      <BottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Ledger Entry"
        subtitle={driver?.driver_name || "Driver"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "800", marginBottom: 10, letterSpacing: 0.5 }}>ENTRY TYPE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            {([
              { id: "ADVANCE", label: "Advance" },
              { id: "EXPENSE", label: "Expense" },
            ] as { id: QuickType; label: string }[]).map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setQuickType(type.id)}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: quickType === type.id ? colors.primary : colors.border,
                  backgroundColor: quickType === type.id ? colors.primary : colors.card,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: quickType === type.id ? "white" : colors.foreground, fontSize: 14, fontWeight: "700" }}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Amount">
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
                padding: 18,
                fontSize: 32,
                fontWeight: "900",
                marginBottom: 4,
                textAlign: "center",
                backgroundColor: isDark ? colors.card : colors.secondary + "10"
              }}
            />
          </Field>

          <Field label="Purpose">
            <TextInput
              placeholder="Trip diesel, advance, settlement..."
              placeholderTextColor={colors.mutedForeground}
              value={purpose}
              onChangeText={setPurpose}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                color: colors.foreground,
                backgroundColor: isDark ? colors.card : colors.secondary + "10",
                padding: 16,
                fontSize: 15,
                fontWeight: "600"
              }}
            />
          </Field>

          <Field label="Payment Mode">
            <View style={{ flexDirection: "row", gap: 10 }}>
              {["CASH", "UPI", "BANK"].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setPaymentMode(mode)}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: paymentMode === mode ? colors.primary : colors.border,
                    backgroundColor: paymentMode === mode ? colors.primary : colors.card,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: paymentMode === mode ? "white" : colors.foreground, fontSize: 12, fontWeight: "800" }}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              style={{ flex: 1, height: 60, borderRadius: 20, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submitQuickAdd}
              style={{ flex: 2, height: 60, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>{loading ? "Saving..." : "Save Entry"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function input(colors: any) {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.foreground,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 11,
  } as const;
}

function Field({ label, children }: { label: string; children: any }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "800", marginBottom: 8, letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "green" | "red" }) {
  const { colors } = useThemeStore();
  const color = tone === "green" ? colors.success : colors.destructive;
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
      <Text style={{ color, fontWeight: "800", fontSize: 14 }}>Rs {Number(value || 0).toLocaleString()}</Text>
    </View>
  );
}
