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
import { Skeleton } from "../../components/Skeleton";
import FinanceFAB from "../../components/finance/FinanceFAB";
import QuickActionButton from "../../components/finance/QuickActionButton";
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import useTrucks from "../../hooks/useTruck";
import { formatDate, formatLabel } from "../../lib/utils";

const MAINTENANCE_ACTIONS = [
  { label: "Document Expenses", value: "DOCUMENT" },
  { label: "Service & Repair", value: "SERVICE_REPAIR" },
] as const;

export default function MaintenanceDashboardScreen() {
  const router = useRouter();
  const { truckId } = useLocalSearchParams<{ truckId?: string }>();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, addMaintenanceExpense, loading: financeLoading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [entryType, setEntryType] = useState<string>("SERVICE_REPAIR");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");

  const selectedTruck = useMemo(() => (trucks || []).find((t: any) => String(t._id) === String(truckId)), [trucks, truckId]);

  const loadData = useCallback(async () => {
    if (!truckId) return;
    await Promise.all([
      fetchTrucks(),
      fetchTransactions({ direction: "EXPENSE", sourceModule: "MAINTENANCE", truckId }),
    ]);
  }, [fetchTrucks, fetchTransactions, truckId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const truckRows = useMemo(() => {
    const rows = (transactions || []).filter((t: any) => {
      if (String(t?.truckId || "") !== String(truckId)) return false;
      const service = String(t?.serviceType || t?.category || "").toUpperCase();
      return service === "DOCUMENT" || service === "SERVICE" || service === "REPAIR";
    });
    return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, truckId]);

  const totalExpense = useMemo(() => truckRows.reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0), [truckRows]);
  const showInitialSkeleton = financeLoading && !refreshing && truckRows.length === 0;

  const onSave = async () => {
    if (!truckId) {
      Alert.alert("Truck Required", "Select a truck.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    const backendType = entryType === "DOCUMENT" ? "DOCUMENT" : "SERVICE";

    await addMaintenanceExpense({
      truckId,
      category: backendType,
      serviceType: backendType,
      amount: Number(amount),
      paymentMode,
      notes,
      date: new Date().toISOString(),
    });

    setShowAdd(false);
    setAmount("");
    setNotes("");
    setPaymentMode("CASH");
    await loadData();
  };

  const openAddModal = (type: string) => {
    setEntryType(type);
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
          {selectedTruck?.registration_number || "Truck"} Maintenance
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Lifetime Summary card */}
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
            LIFETIME MAINTENANCE
          </Text>
          <View>
            <Text style={{ color: colors.destructive, fontSize: 24, fontWeight: "800" }}>
              Rs {totalExpense.toLocaleString()}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
              Total repairs & document costs
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          QUICK ADD
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {MAINTENANCE_ACTIONS.map((action) => (
            <QuickActionButton key={action.value} label={action.label} onPress={() => openAddModal(action.value)} />
          ))}
        </View>

        {/* Expense History */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          REPAIR HISTORY
        </Text>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} width="100%" height={86} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {truckRows.length === 0 && !financeLoading && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 30, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground }}>No maintenance records found.</Text>
          </View>
        )}

        {!showInitialSkeleton && truckRows.map((item: any) => {
          const rawType = String(item.serviceType || item.category || "").toUpperCase();
          const isDocument = rawType === "DOCUMENT";

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
                        backgroundColor: isDocument ? "#e0f2fe" : "#fee2e2",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: isDocument ? "#0369a1" : "#dc2626",
                        }}
                      >
                        {isDocument ? "DOCUMENT" : "SERVICE & REPAIR"}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>{item.paymentMode || "Cash"}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>
                    {item.notes || (isDocument ? "Document Processing" : "Vehicle Repair")}
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

      <FinanceFAB onPress={() => openAddModal("SERVICE_REPAIR")} />

      {/* Add Maintenance Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <KeyboardAwareScrollView enableOnAndroid keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}>
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

              <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18, marginBottom: 16 }}>Record Maintenance</Text>

              {/* Truck Info Chip */}
              <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: colors.primary + "20", marginBottom: 20 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{selectedTruck?.registration_number || "-"}</Text>
              </View>

              {/* Category selector */}
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8 }}>CATEGORY</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {MAINTENANCE_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.value}
                    onPress={() => setEntryType(action.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: entryType === action.value ? colors.primary : colors.border,
                      backgroundColor: entryType === action.value ? colors.primary : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: entryType === action.value ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>{action.label}</Text>
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
                placeholder="Work details / Notes"
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.foreground, padding: 12, fontSize: 14, marginBottom: 20, textAlignVertical: "top", minHeight: 60 }}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSave} style={{ flex: 2, padding: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center" }}>
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>{financeLoading ? "Saving..." : "Save Maintenance"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
