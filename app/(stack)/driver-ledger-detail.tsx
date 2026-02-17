import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useDrivers from "../../hooks/useDriver";
import useDriverFinance, { TransactionNature } from "../../hooks/useDriverFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

type FilterType = "ALL" | "OWNER_TO_DRIVER" | "DRIVER_SPEND" | "DRIVER_TO_VENDOR";
type QuickType = "ADVANCE" | "SETTLEMENT" | "ADJUSTMENT";

export default function DriverLedgerDetailScreen() {
  const router = useRouter();
  const { driverId } = useLocalSearchParams<{ driverId?: string | string[] }>();
  const id = Array.isArray(driverId) ? driverId[0] : driverId;
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { drivers, fetchDrivers } = useDrivers();
  const { entries, loading, fetchDriverLedger, fetchDriverSummary, addLedgerEntry, updateEntryStatus } = useDriverFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [netBalance, setNetBalance] = useState(0);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [quickType, setQuickType] = useState<QuickType>("ADVANCE");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");

  const driver = useMemo(() => (drivers || []).find((d) => d._id === id), [drivers, id]);

  const load = useCallback(async () => {
    if (!id) return;
    await Promise.all([
      fetchDrivers(),
      fetchDriverLedger(id),
      fetchDriverSummary(id).then((r) => setNetBalance(r.net_balance)),
    ]);
  }, [id, fetchDrivers, fetchDriverLedger, fetchDriverSummary]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const normalized = useMemo(() => {
    const sorted = [...(entries || [])].sort((a, b) => {
      const ad = new Date((a as any).createdAt || (a as any).entry_date || 0).getTime();
      const bd = new Date((b as any).createdAt || (b as any).entry_date || 0).getTime();
      return ad - bd;
    });

    let running = 0;
    return sorted.map((entry) => {
      const nature = entry.transaction_nature;
      const title = (entry.title || "").toUpperCase();
      let type: FilterType = "DRIVER_SPEND";
      if (nature === "received_by_driver" || title.includes("OWNER_TO_DRIVER")) type = "OWNER_TO_DRIVER";
      else if (title.includes("VENDOR")) type = "DRIVER_TO_VENDOR";
      else type = "DRIVER_SPEND";

      const credit = type === "OWNER_TO_DRIVER" ? Number(entry.amount || 0) : 0;
      const debit = type === "OWNER_TO_DRIVER" ? 0 : Number(entry.amount || 0);
      running = running + credit - debit;

      return {
        ...entry,
        type,
        credit,
        debit,
        runningBalance: running,
      };
    });
  }, [entries]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return normalized;
    return normalized.filter((e) => e.type === filter);
  }, [normalized, filter]);

  const totals = useMemo(() => {
    const given = normalized.reduce((a, e) => a + e.credit, 0);
    const spent = normalized.reduce((a, e) => a + e.debit, 0);
    return { given, spent, balance: given - spent };
  }, [normalized]);

  const driverTransactions = useMemo(
    () => filtered.filter((e) => e.type !== "OWNER_TO_DRIVER"),
    [filtered]
  );

  const submitQuickAdd = async () => {
    if (!id) return;
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    const transactionNature: TransactionNature =
      quickType === "ADVANCE" ? "received_by_driver" : "paid_by_driver";

    const remark = `${quickType} | ${purpose || "General"} | ${paymentMode}${notes ? ` | ${notes}` : ""}`;

    await addLedgerEntry({
      driver_id: id,
      transaction_nature: transactionNature,
      counterparty_type: quickType === "SETTLEMENT" ? "vendor" : "owner",
      direction: transactionNature === "paid_by_driver" ? "to" : "from",
      amount: Number(amount),
      remarks: remark,
    });

    setShowAdd(false);
    setAmount("");
    setPurpose("");
    setPaymentMode("CASH");
    setNotes("");
    await load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Driver Khata</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>{driver?.driver_name || driver?.name || "Driver"}</Text>
          <Text style={{ color: colors.mutedForeground, marginTop: 2 }}>{driver?.contact_number || driver?.phone || "-"}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <SummaryCard label="Total Given" value={totals.given} tone="green" />
          <SummaryCard label="Total Spent" value={totals.spent} tone="red" />
          <SummaryCard label="Balance" value={totals.balance} tone={totals.balance >= 0 ? "green" : "red"} />
        </View>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 12 }}>
          Dynamic Balance (API): ₹{Number(netBalance || 0).toLocaleString()}
        </Text>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>SECTION B: OWNER → DRIVER</Text>
          <Text style={{ color: colors.foreground, marginBottom: 8 }}>Quick add owner advance/settlement/adjustment</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["ADVANCE", "SETTLEMENT", "ADJUSTMENT"] as QuickType[]).map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => {
                  setQuickType(q);
                  setShowAdd(true);
                }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary }}
              >
                <Text style={{ color: "white", textAlign: "center", fontSize: 11, fontWeight: "700" }}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>SECTION C: DRIVER TRANSACTIONS</Text>
          {driverTransactions.slice(-5).reverse().map((entry: any) => (
            <Row
              key={entry._id}
              title={entry.remarks || entry.type}
              subtitle={`${formatDate((entry as any).createdAt || (entry as any).entry_date)} | ${entry.type}`}
              amount={entry.debit}
              isDebit
              pending={entry.approvalStatus === "PENDING"}
              onApprove={entry.approvalStatus === "PENDING" ? () => updateEntryStatus(String(entry._id), "APPROVED") : undefined}
              onReject={entry.approvalStatus === "PENDING" ? () => updateEntryStatus(String(entry._id), "REJECTED") : undefined}
            />
          ))}
          {driverTransactions.length === 0 && <Text style={{ color: colors.mutedForeground }}>No driver spends found.</Text>}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>SECTION D: COMPLETE LEDGER</Text>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {(["ALL", "OWNER_TO_DRIVER", "DRIVER_SPEND", "DRIVER_TO_VENDOR"] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: filter === f ? colors.primary : colors.border,
                  backgroundColor: filter === f ? colors.primary : "transparent",
                }}
              >
                <Text style={{ color: filter === f ? "white" : colors.foreground, fontSize: 10, fontWeight: "700" }}>{f.replaceAll("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.map((entry: any) => (
            <View key={entry._id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>{formatDate((entry as any).createdAt || (entry as any).entry_date)} | {entry.type.replaceAll("_", " ")}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{entry.remarks || "-"}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                <Text style={{ color: colors.success, fontSize: 12 }}>Credit: ₹{Number(entry.credit || 0).toLocaleString()}</Text>
                <Text style={{ color: colors.destructive, fontSize: 12 }}>Debit: ₹{Number(entry.debit || 0).toLocaleString()}</Text>
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700" }}>Bal: ₹{Number(entry.runningBalance || 0).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
            <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16, marginBottom: 10 }}>Add Entry ({quickType})</Text>
            <TextInput placeholder="Amount" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" value={amount} onChangeText={setAmount} style={input(colors)} />
            <TextInput placeholder="Purpose" placeholderTextColor={colors.mutedForeground} value={purpose} onChangeText={setPurpose} style={input(colors)} />
            <TextInput placeholder="Payment Mode" placeholderTextColor={colors.mutedForeground} value={paymentMode} onChangeText={setPaymentMode} style={input(colors)} />
            <TextInput placeholder="Notes" placeholderTextColor={colors.mutedForeground} value={notes} onChangeText={setNotes} style={input(colors)} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.card }}>
                <Text style={{ color: colors.foreground, textAlign: "center", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitQuickAdd} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.primary }}>
                <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{loading ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function input(colors: any) {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.foreground,
    padding: 10,
    marginBottom: 8,
  } as const;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "green" | "red" }) {
  const { colors } = useThemeStore();
  const color = tone === "green" ? colors.success : colors.destructive;
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
      <Text style={{ color, fontWeight: "800", fontSize: 13 }}>₹{Number(value || 0).toLocaleString()}</Text>
    </View>
  );
}

function Row({
  title,
  subtitle,
  amount,
  isDebit,
  pending,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle: string;
  amount: number;
  isDebit?: boolean;
  pending?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const { colors } = useThemeStore();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: colors.foreground, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{subtitle}</Text>
        </View>
        <Text style={{ color: isDebit ? colors.destructive : colors.success, fontWeight: "800" }}>
          {isDebit ? "-" : "+"}₹{Number(amount || 0).toLocaleString()}
        </Text>
      </View>
      {pending && (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <TouchableOpacity onPress={onReject} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#fee2e2" }}>
            <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 11 }}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onApprove} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#dcfce7" }}>
            <Text style={{ color: "#166534", fontWeight: "700", fontSize: 11 }}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
