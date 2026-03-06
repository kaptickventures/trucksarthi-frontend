import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
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
import BottomSheet from "../../components/BottomSheet";
import { Skeleton } from "../../components/Skeleton";
import FinanceFAB from "../../components/finance/FinanceFAB";
import QuickActionButton from "../../components/finance/QuickActionButton";
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import useTrucks from "../../hooks/useTruck";
import { formatDate, formatLabel } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

const MAINTENANCE_ACTIONS = [
  { label: "Document Expenses", value: "DOCUMENT" },
  { label: "Service & Repair", value: "SERVICE_REPAIR" },
] as const;

export default function MaintenanceDashboardScreen() {
  const router = useRouter();
  const { truckId } = useLocalSearchParams<{ truckId?: string }>();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, addMaintenanceExpense, deleteTransaction, loading: financeLoading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "DOCUMENT" | "SERVICE_REPAIR">("ALL");
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

      const isDoc = service === "DOCUMENT";
      const isService = service === "SERVICE" || service === "REPAIR";

      if (filterType === "DOCUMENT" && !isDoc) return false;
      if (filterType === "SERVICE_REPAIR" && !isService) return false;

      return isDoc || isService;
    });
    return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, truckId, filterType]);

  const lifetimeTotal = useMemo(() => {
    return (transactions || []).filter((t: any) => {
      if (String(t?.truckId || "") !== String(truckId)) return false;
      const service = String(t?.serviceType || t?.category || "").toUpperCase();
      return service === "DOCUMENT" || service === "SERVICE" || service === "REPAIR";
    }).reduce((sum, t: any) => sum + Number(t.amount || 0), 0);
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

  const confirmDelete = (id: string) => {
    Alert.alert("Delete", "Delete this maintenance entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTransaction(id);
            await loadData();
          } catch { }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('maintenance')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
            {selectedTruck?.registration_number || "Truck"}
          </Text>
        </View>
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
            {t('lifetimeMaintenance')}
          </Text>
          <View>
            <Text style={{ color: colors.destructive, fontSize: 24, fontWeight: "800" }}>
              Rs {lifetimeTotal.toLocaleString()}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
              Total repairs & document costs
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={{ marginBottom: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { label: "All", value: "ALL" },
              { label: "Document Expenses", value: "DOCUMENT" },
              { label: "Service & Repair", value: "SERVICE_REPAIR" },
            ].map((f: any) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFilterType(f.value)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: filterType === f.value ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: filterType === f.value ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: filterType === f.value ? "white" : colors.foreground,
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Expense History */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          {t('repairHistory')}
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
              <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                <TouchableOpacity onPress={() => confirmDelete(String(item._id))} style={{ padding: 4 }}>
                  <Trash2 size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FinanceFAB onPress={() => openAddModal("SERVICE_REPAIR")} />

      <BottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Record Maintenance"
        subtitle={selectedTruck?.registration_number || "Vehicle"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Category selector */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>CATEGORY</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            {MAINTENANCE_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.value}
                onPress={() => setEntryType(action.value)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: entryType === action.value ? colors.primary : colors.border + '30',
                  backgroundColor: entryType === action.value ? colors.primary : (isDark ? colors.card : colors.secondary + '40'),
                  alignItems: "center",
                }}
              >
                <Text style={{ color: entryType === action.value ? "white" : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
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
              marginBottom: 20
            }}
          />

          {/* Payment Mode chips */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
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

          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>WORK DETAILS / NOTES</Text>
          <TextInput
            placeholder="Work details / Notes"
            placeholderTextColor={colors.mutedForeground + '60'}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + '40',
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border + '30',
              marginBottom: 28,
              textAlignVertical: "top",
              minHeight: 100
            }}
          />

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={onSave}
              style={{ backgroundColor: colors.primary }}
              className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }} className="text-center font-black">SAVE RECORD</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
