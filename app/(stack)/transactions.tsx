import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowDownLeft, ArrowUpRight, Calendar, Filter, Trash2 } from "lucide-react-native";
import FinanceFAB from "../../components/finance/FinanceFAB";
import BottomSheet from "../../components/BottomSheet";
import { Skeleton } from "../../components/Skeleton";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate, formatLabel } from "../../lib/utils";
import useDrivers from "../../hooks/useDriver";
import useClients from "../../hooks/useClient";
import useTrucks from "../../hooks/useTruck";

const TAG_FILTERS = [
  "ALL",
  "MISC_EXPENSE",
  "DRIVER_EXPENSE",
  "CLIENT_PAYMENT",
  "FUEL",
  "FASTAG",
  "MAINTENANCE",
] as const;

type TagFilter = (typeof TAG_FILTERS)[number];

const TAG_PILL_HEIGHT = 40;
const TYPE_PILL_HEIGHT = 36;

export default function TransactionsScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { loading, transactions, fetchTransactions, deleteTransaction } = useFinance();

  const { drivers } = useDrivers();
  const { clients } = useClients();
  const { trucks } = useTrucks();

  const driverMap = useMemo(() => {
    const map: Record<string, string> = {};
    (drivers || []).forEach((d) => {
      if (d && d._id) map[d._id] = d.name || d.driver_name || "Driver";
    });
    return map;
  }, [drivers]);

  const truckMap = useMemo(() => {
    const map: Record<string, string> = {};
    (trucks || []).forEach((t) => {
      if (t && t._id) map[t._id] = t.registration_number;
    });
    return map;
  }, [trucks]);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    (clients || []).forEach((c) => {
      if (c && c._id) map[c._id] = c.client_name;
    });
    return map;
  }, [clients]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTag, setActiveTag] = useState<TagFilter>("ALL");
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    direction: "",
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions({
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
      direction: filters.direction,
    });
    setRefreshing(false);
  }, [fetchTransactions, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onDateChange = (_: any, selectedDate?: Date) => {
    const type = showDatePicker;
    setShowDatePicker(null);
    if (selectedDate && type) {
      setFilters((prev) => ({
        ...prev,
        [type === "start" ? "startDate" : "endDate"]: selectedDate,
      }));
    }
  };

  const filteredTransactions = useMemo(() => {
    const base = (transactions || [])
      .filter((item: any) => {
        const sourceModule = String(item?.sourceModule || "").toUpperCase();
        const category = String(item?.category || "").toUpperCase();
        // Keep only owner-to-driver entries from driver khata in this global list.
        if (sourceModule === "DRIVER_KHATA" && category !== "OWNER_TO_DRIVER") return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = 0;
    const withBalance = base.map((item) => {
      const isIncome = item.direction === "INCOME";
      if (isIncome) currentBalance += Number(item.amount || 0);
      else currentBalance -= Number(item.amount || 0);
      return { ...item, runningBalance: currentBalance };
    });

    const sorted = withBalance.reverse();

    if (activeTag === "ALL") return sorted;

    return sorted.filter((item: any) => {
      const category = String(item?.category || "").toUpperCase();
      const subtype = String(item?.transactionSubtype || "").toUpperCase();
      const sourceModule = String(item?.sourceModule || "").toUpperCase();

      if (activeTag === "MISC_EXPENSE") return sourceModule === "MISC" && item.direction === "EXPENSE";
      if (activeTag === "DRIVER_EXPENSE") return sourceModule === "DRIVER_KHATA";
      if (activeTag === "CLIENT_PAYMENT") return sourceModule === "CLIENT_PAYMENT";
      if (activeTag === "FUEL") return category.includes("FUEL") || subtype.includes("FUEL");
      if (activeTag === "FASTAG") return category.includes("FASTAG") || subtype.includes("FASTAG");
      if (activeTag === "MAINTENANCE") return sourceModule === "MAINTENANCE";
      return true;
    });
  }, [transactions, activeTag]);

  const confirmDelete = (id: string) => {
    Alert.alert("Delete", "Delete this transaction?", [
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

  const renderItem = ({ item }: { item: any }) => {
    const isIncome = item.direction === "INCOME";
    const iconColor = isIncome ? "#16a34a" : "#dc2626";
    const bgColor = isIncome ? "#dcfce7" : "#fee2e2";
    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

    const partyName = item.driverId ? driverMap[String(item.driverId)] :
      item.clientId ? clientMap[String(item.clientId)] :
        item.truckId ? truckMap[String(item.truckId)] : "";

    return (
      <View
        style={{
          backgroundColor: colors.card,
          padding: 16,
          borderRadius: 12,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Icon size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            {formatLabel(item.category)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {partyName ? `${partyName} • ` : ""}{item.notes || formatLabel(item.sourceModule)}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
              {formatDate(item.date)}
            </Text>
            {item.approvalStatus === "PENDING" && (
              <Text style={{ fontSize: 10, color: "#f59e0b", fontWeight: "bold" }}>PENDING</Text>
            )}
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: iconColor }}>
            {isIncome ? "+" : "-"}Rs {Number(item.amount || 0).toLocaleString()}
          </Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginTop: 2 }}>
            Bal: Rs {Number(item.runningBalance || 0).toLocaleString()}
          </Text>
          <Text style={{ fontSize: 9, color: colors.mutedForeground, marginTop: 1 }}>
            {item.paymentMode || "CASH"}
          </Text>
          <TouchableOpacity
            onPress={() => confirmDelete(String(item._id))}
            style={{ marginTop: 6, padding: 4 }}
          >
            <Trash2 size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <FlatList
        style={{ flex: 1 }}
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={(item: any) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={{ paddingBottom: 16 }}>
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('transactions')}</Text>
                <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Financial history</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilterModal(true)}
                className="w-10 h-10 rounded-full items-center justify-center border"
                style={{ backgroundColor: colors.muted, borderColor: colors.border + '33' }}
              >
                <Filter size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={TAG_FILTERS as any}
              keyExtractor={(item) => item}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveTag(item as TagFilter)}
                  style={{
                    paddingHorizontal: 16,
                    height: TAG_PILL_HEIGHT,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: activeTag === item ? colors.primary : colors.border,
                    backgroundColor: activeTag === item ? colors.primary : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: activeTag === item ? "white" : colors.foreground,
                      fontWeight: "700",
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    {formatLabel(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
        ListEmptyComponent={
          loading && !transactions.length ? (
            <View style={{ flex: 1, padding: 20 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} width="100%" height={70} borderRadius={12} style={{ marginBottom: 12 }} />
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ color: colors.mutedForeground }}>No transactions found.</Text>
            </View>
          )
        }
      />

      <BottomSheet
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Transactions"
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Date Range</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker("start")}
              style={{
                flex: 1,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: isDark ? colors.card : colors.secondary + '10'
              }}
            >
              <Calendar size={16} color={colors.mutedForeground} />
              <Text style={{ color: colors.foreground }}>{formatDate(filters.startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDatePicker("end")}
              style={{
                flex: 1,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: isDark ? colors.card : colors.secondary + '10'
              }}
            >
              <Calendar size={16} color={colors.mutedForeground} />
              <Text style={{ color: colors.foreground }}>{formatDate(filters.endDate)}</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Type</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {["ALL", "INCOME", "EXPENSE"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    direction: type === "ALL" ? "" : type,
                  }))
                }
                style={{
                  flex: 1,
                  height: TYPE_PILL_HEIGHT,
                  borderRadius: 20,
                  backgroundColor:
                    filters.direction === type || (type === "ALL" && !filters.direction)
                      ? colors.primary
                      : (isDark ? colors.card : colors.secondary + '10'),
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    textAlign: "center",
                    color:
                      filters.direction === type || (type === "ALL" && !filters.direction)
                        ? "white"
                        : colors.foreground,
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => {
              setShowFilterModal(false);
              loadData();
            }}
            style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Apply Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      {showDatePicker && (
        <DateTimePicker
          value={(showDatePicker === "start" ? filters.startDate : filters.endDate) || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <FinanceFAB onPress={() => router.push("/(stack)/misc-transactions" as any)} />
    </View>
  );
}
