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
import { Skeleton } from "../../components/Skeleton";
import useClients from "../../hooks/useClient";
import { useClientLedger } from "../../hooks/useClientLedger";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

export default function ClientLedgerDetailScreen() {
    const router = useRouter();
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";

    const { clientId } = useLocalSearchParams<{ clientId?: string | string[] }>();
    const id = Array.isArray(clientId) ? clientId[0] : clientId;

    const { clients, fetchClients } = useClients();
    const { entries, loading, fetchLedger, fetchSummary, addPayment } = useClientLedger();

    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState({ total_debits: 0, total_credits: 0, outstanding: 0 });
    const [showAdd, setShowAdd] = useState(false);
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("CASH");
    const [remarks, setRemarks] = useState("");

    const client = useMemo(
        () => (clients || []).find((c: any) => String(c._id) === String(id)),
        [clients, id]
    );

    const load = useCallback(async () => {
        if (!id) return;
        await Promise.all([
            fetchClients(),
            fetchLedger(id),
            fetchSummary(id).then(setSummary).catch(() => { }),
        ]);
    }, [id, fetchClients, fetchLedger, fetchSummary]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const submitPayment = async () => {
        if (!id) return;
        if (!amount || Number(amount) <= 0) {
            Alert.alert("Invalid Amount", "Enter a valid amount.");
            return;
        }
        await addPayment({
            client_id: id,
            amount: Number(amount),
            paymentMode,
            remarks,
            date: new Date().toISOString(),
        });
        setShowAdd(false);
        setAmount("");
        setPaymentMode("CASH");
        setRemarks("");
        await load();
    };

    // Sort entries newest first
    const sortedEntries = useMemo(
        () =>
            [...(entries || [])].sort(
                (a: any, b: any) =>
                    new Date(b.entry_date || b.createdAt || 0).getTime() -
                    new Date(a.entry_date || a.createdAt || 0).getTime()
            ),
        [entries]
    );

    const outstanding = Math.max(0, summary.total_debits - summary.total_credits);

    if (loading && !client) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
                <Skeleton width={160} height={24} style={{ marginBottom: 14 }} />
                <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={300} borderRadius={16} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View
                style={{
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Client Khata</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Client Card */}
                <View
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
                        {(client as any)?.client_name || "Client"}
                    </Text>
                    {!!(client as any)?.contact_number && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <Ionicons name="call-outline" size={13} color={colors.mutedForeground} />
                            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                                {(client as any).contact_number}
                            </Text>
                        </View>
                    )}
                    <View
                        style={{
                            marginTop: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 10,
                            backgroundColor: outstanding > 0 ? "#fee2e2" : "#dcfce7",
                            alignSelf: "flex-start",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: "800",
                                color: outstanding > 0 ? "#dc2626" : "#16a34a",
                            }}
                        >
                            {outstanding > 0 ? `-Rs ${outstanding.toLocaleString()} outstanding` : "Fully Settled ✓"}
                        </Text>
                    </View>
                </View>

                {/* Summary Row */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    <SummaryCard label="Total Billed" value={summary.total_debits} tone="neutral" colors={colors} />
                    <SummaryCard label="Received" value={summary.total_credits} tone="green" colors={colors} />
                    <SummaryCard label="Outstanding" value={outstanding} tone="red" colors={colors} />
                </View>

                {/* Ledger Entries */}
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 10 }}>
                    LEDGER ENTRIES
                </Text>
                <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
                    {sortedEntries.length === 0 && (
                        <Text style={{ color: colors.mutedForeground, textAlign: "center", paddingVertical: 20 }}>
                            No ledger entries found.
                        </Text>
                    )}

                    {sortedEntries.map((entry: any, idx: number) => {
                        const isCredit = entry.entry_type === "credit";
                        return (
                            <View
                                key={entry._id || idx}
                                style={{
                                    borderTopWidth: idx === 0 ? 0 : 1,
                                    borderTopColor: colors.border,
                                    paddingTop: idx === 0 ? 0 : 12,
                                    marginTop: idx === 0 ? 0 : 12,
                                }}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <View style={{ flex: 1, marginRight: 12 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                            <View
                                                style={{
                                                    paddingHorizontal: 7,
                                                    paddingVertical: 2,
                                                    borderRadius: 6,
                                                    backgroundColor: isCredit ? "#dcfce7" : "#fff7ed",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: "800",
                                                        color: isCredit ? "#16a34a" : "#9a3412",
                                                    }}
                                                >
                                                    {isCredit ? "PAYMENT" : "INVOICE"}
                                                </Text>
                                            </View>
                                            {entry.payment_mode && (
                                                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600" }}>
                                                    {entry.payment_mode}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
                                            {entry.remarks || (isCredit ? "Payment received" : "Invoice raised")}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 3 }}>
                                            {formatDate(entry.entry_date || entry.createdAt)}
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontWeight: "800",
                                            color: isCredit ? "#16a34a" : colors.foreground,
                                        }}
                                    >
                                        {isCredit ? "+" : ""}Rs {Number(entry.amount || 0).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
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

                            <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18, marginBottom: 4 }}>
                                Record Payment
                            </Text>

                            {client && (
                                <View
                                    style={{
                                        alignSelf: "flex-start",
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 20,
                                        backgroundColor: colors.primary + "20",
                                        marginBottom: 20,
                                    }}
                                >
                                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                                        {(client as any).client_name}
                                    </Text>
                                </View>
                            )}

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

                            {/* Payment Mode chips */}
                            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>
                                PAYMENT MODE
                            </Text>
                            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                                {["CASH", "BANK", "UPI", "CHEQUE"].map((mode) => (
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
                                        <Text
                                            style={{
                                                color: paymentMode === mode ? "white" : colors.foreground,
                                                fontWeight: "700",
                                                fontSize: 11,
                                            }}
                                        >
                                            {mode}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Remarks */}
                            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>
                                REMARKS (OPTIONAL)
                            </Text>
                            <TextInput
                                placeholder="e.g. Against invoice #123..."
                                placeholderTextColor={colors.mutedForeground}
                                value={remarks}
                                onChangeText={setRemarks}
                                multiline
                                numberOfLines={2}
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: 12,
                                    color: colors.foreground,
                                    padding: 12,
                                    fontSize: 14,
                                    marginBottom: 20,
                                    textAlignVertical: "top",
                                    minHeight: 60,
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
                                    onPress={submitPayment}
                                    style={{
                                        flex: 2,
                                        padding: 14,
                                        borderRadius: 12,
                                        backgroundColor: colors.primary,
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
                                        {loading ? "Saving..." : "Save Payment"}
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

function SummaryCard({
    label,
    value,
    tone,
    colors,
}: {
    label: string;
    value: number;
    tone: "green" | "red" | "neutral";
    colors: any;
}) {
    const color = tone === "green" ? colors.success : tone === "red" ? colors.destructive : colors.foreground;
    return (
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "600", marginBottom: 4 }}>{label}</Text>
            <Text style={{ color, fontWeight: "800", fontSize: 13 }}>Rs {Number(value || 0).toLocaleString()}</Text>
        </View>
    );
}

function inputStyle(colors: any) {
    return {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        color: colors.foreground,
        padding: 10,
        marginBottom: 10,
    } as const;
}
