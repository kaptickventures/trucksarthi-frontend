import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowDownLeft, ArrowUpRight, Calendar, Filter } from "lucide-react-native";
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
type DatePickerField = "startDate" | "endDate" | null;

const TAG_PILL_HEIGHT = 40;
const TYPE_PILL_HEIGHT = 36;

export default function TransactionsScreen() {
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { loading, transactions, fetchTransactions } = useFinance();

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
    sourceModule: "",
    paymentMode: "",
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<DatePickerField>(null);

  const loadData = useCallback(async (activeFilters: typeof filters) => {
    setRefreshing(true);
    await fetchTransactions({
      startDate: activeFilters.startDate ? activeFilters.startDate.toISOString() : undefined,
      endDate: activeFilters.endDate ? activeFilters.endDate.toISOString() : undefined,
      direction: activeFilters.direction,
    });
    setRefreshing(false);
  }, [fetchTransactions]);

  useEffect(() => {
    loadData(filters);
  }, [loadData]);

  const sourceModuleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (transactions || [])
            .map((item: any) => String(item?.sourceModule || "").toUpperCase())
            .filter(Boolean)
        )
      ).sort(),
    [transactions]
  );

  const paymentModeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (transactions || [])
            .map((item: any) => String(item?.paymentMode || "").toUpperCase())
            .filter(Boolean)
        )
      ).sort(),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const base = (transactions || [])
      .filter((item: any) => {
        const sourceModule = String(item?.sourceModule || "").toUpperCase();
        const category = String(item?.category || "").toUpperCase();
        const direction = String(item?.direction || "").toUpperCase();
        const paymentMode = String(item?.paymentMode || "").toUpperCase();
        const txDate = new Date(item?.date);

        // Keep only owner-to-driver entries from driver khata in this global list.
        if (sourceModule === "DRIVER_KHATA" && category !== "OWNER_TO_DRIVER") return false;
        if (filters.direction && direction !== filters.direction) return false;
        if (filters.sourceModule && sourceModule !== filters.sourceModule) return false;
        if (filters.paymentMode && paymentMode !== filters.paymentMode) return false;
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) return false;
        }
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
  }, [transactions, activeTag, filters]);

  const renderItem = ({ item }: { item: any }) => {
    const isIncome = item.direction === "INCOME";
    const iconColor = isIncome ? colors.success : colors.destructive;
    const bgColor = isIncome ? colors.successSoft : colors.destructiveSoft;
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
          borderWidth: 1,
          borderColor: colors.border,
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
              <Text style={{ fontSize: 10, color: colors.warning, fontWeight: "bold" }}>PENDING</Text>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(filters)} tintColor={colors.primary} />
        }
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
        onClose={() => {
          setShowFilterModal(false);
          setShowDatePicker(null);
        }}
        title="Filter Transactions"
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Date Range</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker("startDate")}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: isDark ? colors.card : colors.secondary + "10"
                }}
              >
                <Calendar size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.foreground }}>{formatDate(draftFilters.startDate)}</Text>
              </TouchableOpacity>
              {showDatePicker === "startDate" && (
                <DateTimePicker
                  value={draftFilters.startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(null);
                    if (selectedDate) {
                      setDraftFilters((prev) => ({ ...prev, startDate: selectedDate }));
                    }
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker("endDate")}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: isDark ? colors.card : colors.secondary + "10"
                }}
              >
                <Calendar size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.foreground }}>{formatDate(draftFilters.endDate)}</Text>
              </TouchableOpacity>
              {showDatePicker === "endDate" && (
                <DateTimePicker
                  value={draftFilters.endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(null);
                    if (selectedDate) {
                      setDraftFilters((prev) => ({ ...prev, endDate: selectedDate }));
                    }
                  }}
                />
              )}
            </View>
          </View>

          <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Type</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {["ALL", "INCOME", "EXPENSE"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  if (type === "ALL") {
                    setDraftFilters((prev) => ({ ...prev, direction: "" }));
                    return;
                  }
                  setDraftFilters((prev) => ({
                    ...prev,
                    direction: prev.direction === type ? "" : type,
                  }));
                }}
                style={{
                  flex: 1,
                  height: TYPE_PILL_HEIGHT,
                  borderRadius: 20,
                  backgroundColor:
                    draftFilters.direction === type || (type === "ALL" && !draftFilters.direction)
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
                      draftFilters.direction === type || (type === "ALL" && !draftFilters.direction)
                        ? "white"
                        : colors.foreground,
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Source Module</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {["ALL", ...sourceModuleOptions].map((module) => {
              const active = module === "ALL" ? !draftFilters.sourceModule : draftFilters.sourceModule === module;
              return (
                <TouchableOpacity
                  key={module}
                  onPress={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      sourceModule: module === "ALL" ? "" : (prev.sourceModule === module ? "" : module),
                    }))
                  }
                  style={{
                    paddingHorizontal: 12,
                    height: 34,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.secondary + "10"),
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: active ? "white" : colors.foreground, fontSize: 12, fontWeight: "700" }}>
                    {module === "ALL" ? "All" : formatLabel(module)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Payment Mode</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {["ALL", ...paymentModeOptions].map((mode) => {
              const active = mode === "ALL" ? !draftFilters.paymentMode : draftFilters.paymentMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      paymentMode: mode === "ALL" ? "" : (prev.paymentMode === mode ? "" : mode),
                    }))
                  }
                  style={{
                    paddingHorizontal: 12,
                    height: 34,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.secondary + "10"),
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: active ? "white" : colors.foreground, fontSize: 12, fontWeight: "700" }}>
                    {mode === "ALL" ? "All" : formatLabel(mode)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() =>
                setDraftFilters({
                  startDate: null,
                  endDate: null,
                  direction: "",
                  sourceModule: "",
                  paymentMode: "",
                })
              }
              style={{
                flex: 1,
                backgroundColor: isDark ? colors.card : colors.secondary + "15",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>Reset</Text>
            </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setFilters(draftFilters);
              setShowFilterModal(false);
              setShowDatePicker(null);
              loadData(draftFilters);
            }}
              style={{ flex: 1, backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" }}
          >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>Apply Filters</Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
