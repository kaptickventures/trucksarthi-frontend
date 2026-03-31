import { Ionicons } from "@expo/vector-icons";
import { NotificationBadge } from "../../../components/NotificationBadge";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft, ArrowUpRight, Calendar, Filter } from "lucide-react-native";
import { DatePickerModal } from "../../../components/DatePickerModal";
import SideMenu from "../../../components/SideMenu";
import { Skeleton } from "../../../components/Skeleton";
import useFinance from "../../../hooks/useFinance";
import { useThemeStore } from "../../../hooks/useThemeStore";
import { useTranslation } from "../../../context/LanguageContext";
import { formatDate, formatLabel, toLocalEndOfDayIso, toLocalStartOfDayIso } from "../../../lib/utils";
import useDrivers from "../../../hooks/useDriver";
import useClients from "../../../hooks/useClient";
import useTrucks from "../../../hooks/useTruck";

const TAG_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "DRIVER_EXPENSE", label: "Driver Advances" },
  { key: "CLIENT_KHATA", label: "Client Payments" },
  { key: "TRUCK_EXPENSE", label: "Truck Expenses" },
  { key: "MISC_KHATA", label: "Misc Payments" },
] as const;

const getFriendlyFilterLabel = (value: string) => {
  const upper = String(value || "").toUpperCase();
  if (upper === "DRIVER_EXPENSE" || upper === "DRIVER_KHATA" || upper === "DRIVER") return "Driver Advances";
  if (upper === "CLIENT_PAYMENT" || upper === "CLIENT_KHATA" || upper === "CLIENT") return "Client Payments";
  if (upper === "MISC_EXPENSE" || upper === "MISC_KHATA" || upper === "MISC") return "Misc Payments";
  return formatLabel(value);
};

type TagFilter = (typeof TAG_FILTERS)[number]["key"];

const TAG_PILL_HEIGHT = 40;
const TYPE_PILL_HEIGHT = 36;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  // @ts-ignore
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [menuVisible, setMenuVisible] = useState(false);
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
    paymentMode: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);

  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
    }, [])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: "transparent",
      },
      headerBackground: () => (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        />
      ),
      headerTitleStyle: { color: colors.foreground, fontWeight: "800", fontSize: 22 },
      headerTintColor: colors.foreground,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Ionicons name={menuVisible ? "close" : "menu"} size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/(stack)/notifications" as any)}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <NotificationBadge size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, menuVisible, colors.background, colors.border, colors.foreground, router]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions({
      startDate: filters.startDate ? toLocalStartOfDayIso(filters.startDate) : undefined,
      endDate: filters.endDate ? toLocalEndOfDayIso(filters.endDate) : undefined,
      direction: filters.direction,
      paymentMode: filters.paymentMode,
    });
    setRefreshing(false);
  }, [fetchTransactions, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowDatePicker(null);
    if (showFilters) {
      setShowFilters(false);
      return;
    }
    // Delay opening so the same tap doesn't immediately trigger the backdrop close.
    setTimeout(() => setShowFilters(true), 0);
  };

  const resetFilters = () => {
    setShowDatePicker(null);
    setFilters({
      startDate: null,
      endDate: null,
      direction: "",
      paymentMode: "",
    });
    loadData();
  };

  const openDatePicker = (field: "start" | "end") => {
    setShowDatePicker(field);
  };

  const closeDatePicker = () => setShowDatePicker(null);

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

    const filtered = sorted.filter((item: any) => {
      const direction = String(item?.direction || "").toUpperCase();
      const paymentMode = String(item?.paymentMode || "").toUpperCase();
      const txDate = new Date(item?.date);

      if (filters.direction && direction !== filters.direction) return false;
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
    });

    if (activeTag === "ALL") return filtered;

    return filtered.filter((item: any) => {
      const category = String(item?.category || "").toUpperCase();
      const subtype = String(item?.transactionSubtype || "").toUpperCase();
      const sourceModule = String(item?.sourceModule || "").toUpperCase();

      if (activeTag === "MISC_KHATA") return sourceModule === "MISC";
      if (activeTag === "DRIVER_EXPENSE") return sourceModule === "DRIVER_KHATA";
      if (activeTag === "CLIENT_KHATA") return sourceModule === "CLIENT_PAYMENT";
      if (activeTag === "TRUCK_EXPENSE")
        return (
          sourceModule === "RUNNING_EXPENSE" ||
          sourceModule === "MAINTENANCE" ||
          category.includes("FUEL") ||
          subtype.includes("FUEL") ||
          category.includes("FASTAG") ||
          subtype.includes("FASTAG")
        );
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
            {partyName ? `${partyName} | ` : ""}{item.notes || getFriendlyFilterLabel(item.sourceModule)}
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
            {isIncome ? "+" : "-"}₹ {Number(item.amount || 0).toLocaleString()}
          </Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginTop: 2 }}>
            Bal: ₹ {Number(item.runningBalance || 0).toLocaleString()}
          </Text>
          <Text style={{ fontSize: 9, color: colors.mutedForeground, marginTop: 1 }}>
            {item.paymentMode || "CASH"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
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
                onPress={toggleFilters}
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
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveTag(item.key as TagFilter)}
                  style={{
                    paddingHorizontal: 16,
                    height: TAG_PILL_HEIGHT,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: activeTag === item.key ? colors.primary : colors.border,
                    backgroundColor: activeTag === item.key ? colors.primary : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: activeTag === item.key ? colors.primaryForeground : colors.foreground,
                      fontWeight: "700",
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    {item.label}
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

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => {
          closeDatePicker();
          setShowFilters(false);
        }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableWithoutFeedback
            onPress={() => {
              closeDatePicker();
              setShowFilters(false);
            }}
          >
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay45 }} />
          </TouchableWithoutFeedback>

          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              paddingTop: 12,
              paddingBottom: 16,
              maxHeight: "90%",
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>Filters</Text>
              <TouchableOpacity
                onPress={() => {
                  closeDatePicker();
                  setShowFilters(false);
                }}
                style={{ padding: 8, borderRadius: 999, backgroundColor: colors.secondary }}
              >
                <Ionicons name="close" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
	              <View
	                style={{
	                  backgroundColor: colors.card,
	                  borderColor: colors.border,
	                  borderWidth: 1,
	                  borderRadius: 16,
	                  padding: 14,
	                }}
	              >
	                <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Date Range</Text>
	                <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
	                  <View style={{ flex: 1 }}>
	                    <TouchableOpacity
	                      onPress={() => openDatePicker("start")}
                      style={{
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: colors.input,
                      }}
                    >
                      <Calendar size={16} color={colors.mutedForeground} />
	                      <Text style={{ color: colors.foreground }}>
	                        {filters.startDate ? formatDate(filters.startDate) : "Start date"}
	                      </Text>
	                    </TouchableOpacity>
	                  </View>

	                  <View style={{ flex: 1 }}>
	                    <TouchableOpacity
	                      onPress={() => openDatePicker("end")}
                      style={{
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: colors.input,
                      }}
                    >
                      <Calendar size={16} color={colors.mutedForeground} />
	                      <Text style={{ color: colors.foreground }}>
	                        {filters.endDate ? formatDate(filters.endDate) : "End date"}
	                      </Text>
	                    </TouchableOpacity>
	                  </View>
	                </View>

                <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Type</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {["ALL", "INCOME", "EXPENSE"].map((type) => {
                    const active =
                      (type === "ALL" && !filters.direction) ||
                      (type === "INCOME" && filters.direction === "INCOME") ||
                      (type === "EXPENSE" && filters.direction === "EXPENSE");
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() =>
                          setFilters((prev) => {
                            if (type === "ALL") return { ...prev, direction: "" };
                            return { ...prev, direction: type };
                          })
                        }
                        style={{
                          paddingHorizontal: 14,
                          height: TYPE_PILL_HEIGHT,
                          borderRadius: 20,
                          backgroundColor: active
                            ? colors.primary
                            : (isDark ? colors.card : colors.secondary + "10"),
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
                            color: active ? colors.primaryForeground : colors.foreground,
                          }}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Mode of Payment</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {["ALL", "CASH", "BANK"].map((mode) => {
                    const active =
                      (mode === "ALL" && !filters.paymentMode) ||
                      (mode === "CASH" && filters.paymentMode === "CASH") ||
                      (mode === "BANK" && filters.paymentMode === "BANK");
                    return (
                      <TouchableOpacity
                        key={mode}
                        onPress={() =>
                          setFilters((prev) => {
                            if (mode === "ALL") return { ...prev, paymentMode: "" };
                            return { ...prev, paymentMode: mode };
                          })
                        }
                        style={{
                          paddingHorizontal: 14,
                          height: TYPE_PILL_HEIGHT,
                          borderRadius: 20,
                          backgroundColor: active
                            ? colors.primary
                            : (isDark ? colors.card : colors.secondary + "10"),
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
                            color: active ? colors.primaryForeground : colors.foreground,
                          }}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={resetFilters}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: colors.input,
                    }}
                  >
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      loadData();
                      setShowFilters(false);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.primaryForeground, fontWeight: "bold" }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <DatePickerModal
              visible={showDatePicker === "start"}
              date={filters.startDate || new Date()}
              onClose={closeDatePicker}
              onChange={(selectedDate) => {
                setFilters((prev) => ({
                  ...prev,
                  startDate: selectedDate,
                }));
              }}
            />

            <DatePickerModal
              visible={showDatePicker === "end"}
              date={filters.endDate || new Date()}
              onClose={closeDatePicker}
              onChange={(selectedDate) => {
                setFilters((prev) => ({
                  ...prev,
                  endDate: selectedDate,
                }));
              }}
            />
          </View>
        </View>
      </Modal>

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

