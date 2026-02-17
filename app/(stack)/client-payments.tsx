import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useClients from "../../hooks/useClient";
import { useClientLedger } from "../../hooks/useClientLedger";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

const PAYMENT_MODES = ["", "CASH", "BANK", "UPI"];
const PAYMENT_TYPES: ("" | "FULL" | "PARTIAL")[] = ["", "FULL", "PARTIAL"];

export default function ClientPaymentsScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { clients, fetchClients } = useClients();
  const { loading, paymentRows, paymentSummary, fetchPaymentLedger } = useClientLedger();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"" | "FULL" | "PARTIAL">("");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);

  const load = useCallback(async () => {
    await fetchPaymentLedger({
      clientId: selectedClientId || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentMode: paymentMode || undefined,
      paymentType: paymentType || undefined,
    });
  }, [selectedClientId, startDate, endDate, paymentMode, paymentType, fetchPaymentLedger]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchClients(), load()]);
    setRefreshing(false);
  }, [fetchClients, load]);

  const selectedClient = useMemo(
    () => clients.find((c) => c._id === selectedClientId),
    [clients, selectedClientId]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 19, fontWeight: "700", color: colors.foreground }}>Client Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <SummaryCard label="Today" value={paymentSummary.totalToday} color={colors.success} />
          <SummaryCard label="This Month" value={paymentSummary.totalThisMonth} color={colors.foreground} />
          <SummaryCard label="Count" value={paymentSummary.paymentCount} isCount color={colors.foreground} />
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedForeground, marginBottom: 8 }}>CLIENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <FilterChip
                label="All"
                active={!selectedClientId}
                onPress={() => setSelectedClientId("")}
              />
              {(clients || []).slice(0, 8).map((client) => (
                <FilterChip
                  key={client._id}
                  label={client.client_name}
                  active={selectedClientId === client._id}
                  onPress={() => setSelectedClientId(client._id)}
                />
              ))}
            </View>
          </ScrollView>
          {selectedClient && (
            <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 12 }}>
              Selected: {selectedClient.client_name}
            </Text>
          )}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedForeground, marginBottom: 8 }}>PAYMENT TYPE</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {PAYMENT_TYPES.map((type) => (
              <FilterChip
                key={type || "ALL"}
                label={type || "ALL"}
                active={paymentType === type}
                onPress={() => setPaymentType(type)}
              />
            ))}
          </View>

          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedForeground, marginBottom: 8 }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {PAYMENT_MODES.map((mode) => (
              <FilterChip
                key={mode || "ALL"}
                label={mode || "ALL"}
                active={paymentMode === mode}
                onPress={() => setPaymentMode(mode)}
              />
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker("start")}
              style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>From</Text>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDatePicker("end")}
              style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>To</Text>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {(paymentRows || []).map((row: any) => (
          <View key={row.paymentId} style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontWeight: "700", color: colors.foreground }}>{row.clientName}</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: row.paymentType === "FULL" ? "#dcfce7" : "#fff7ed" }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: row.paymentType === "FULL" ? "#166534" : "#9a3412" }}>{row.paymentType}</Text>
              </View>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 6 }}>
              {row.invoiceNumber ? `Invoice: ${row.invoiceNumber}` : "Invoice: -"} | Mode: {row.paymentMode || "-"}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "800", color: colors.success }}>+₹{Number(row.amountReceived || 0).toLocaleString()}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatDate(row.date)}</Text>
            </View>
          </View>
        ))}

        {!loading && (!paymentRows || paymentRows.length === 0) && (
          <View style={{ marginTop: 30, alignItems: "center" }}>
            <Text style={{ color: colors.mutedForeground }}>No client payments found for selected filters.</Text>
          </View>
        )}
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === "start" ? startDate : endDate}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(null);
            if (!selectedDate) return;
            if (showDatePicker === "start") setStartDate(selectedDate);
            if (showDatePicker === "end") setEndDate(selectedDate);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useThemeStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : "transparent",
      }}
    >
      <Text style={{ color: active ? "white" : colors.foreground, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SummaryCard({ label, value, color, isCount }: { label: string; value: number; color: string; isCount?: boolean }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>{label}</Text>
      <Text style={{ color, fontWeight: "800" }}>{isCount ? Number(value || 0).toLocaleString() : `₹${Number(value || 0).toLocaleString()}`}</Text>
    </View>
  );
}
