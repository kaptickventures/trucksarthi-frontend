import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { Calendar, Download } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { Skeleton } from "../../components/Skeleton";
import FinanceFAB from "../../components/finance/FinanceFAB";
import BottomSheet from "../../components/BottomSheet";
import { DatePickerModal } from "../../components/DatePickerModal";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate, formatLabel, toLocalEndOfDayIso, toLocalStartOfDayIso } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

const RUNNING_ACTIONS = ["FUEL", "FASTAG", "CHALLAN"] as const;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function DailyKhataDashboardScreen() {
  const { truckId } = useLocalSearchParams<{ truckId?: string }>();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, addRunningExpense, loading: financeLoading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string>("FUEL");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<(typeof RUNNING_ACTIONS)[number] | "ALL">("ALL");
  const [amount, setAmount] = useState("");
  const [litres, setLitres] = useState("");
  const [kmReading, setKmReading] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [showDownloadSheet, setShowDownloadSheet] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDateField, setDownloadDateField] = useState<"start" | "end" | null>(null);
  const [downloadRange, setDownloadRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const selectedTruck = useMemo(() => (trucks || []).find((t: any) => String(t._id) === String(truckId)), [trucks, truckId]);
  const monthStart = useMemo(() => toLocalStartOfDayIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), []);

  const loadData = useCallback(async () => {
    if (!truckId) return;
    await Promise.all([
      fetchTrucks(),
      fetchTransactions({
        startDate: monthStart,
        endDate: toLocalEndOfDayIso(new Date()),
        direction: "EXPENSE",
        sourceModule: "RUNNING_EXPENSE",
        truckId,
      }),
    ]);
  }, [fetchTrucks, fetchTransactions, monthStart, truckId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const truckRows = useMemo(() => {
    const rows = (transactions || []).filter(
      (t: any) =>
        String(t?.truckId || "") === String(truckId) &&
        RUNNING_ACTIONS.includes(String(t?.transactionSubtype || t?.category || "") as any)
    );
    return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, truckId]);

  const filteredTruckRows = useMemo(
    () => activeCategoryFilter === "ALL" ? truckRows : truckRows.filter((t: any) => String(t?.transactionSubtype || t?.category || "") === activeCategoryFilter),
    [truckRows, activeCategoryFilter]
  );

  const monthlyExpense = useMemo(() => truckRows.reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0), [truckRows]);
  const totalsByType = useMemo(
    () =>
      RUNNING_ACTIONS.reduce(
        (acc, type) => {
          acc[type] = truckRows
            .filter((t: any) => String(t?.transactionSubtype || t?.category || "") === type)
            .reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0);
          return acc;
        },
        { FUEL: 0, FASTAG: 0, CHALLAN: 0 } as Record<(typeof RUNNING_ACTIONS)[number], number>
      ),
    [truckRows]
  );
  const showInitialSkeleton = financeLoading && !refreshing && filteredTruckRows.length === 0;

  const getEntriesForRange = useCallback(
    (range: { startDate: Date; endDate: Date }) => {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      return filteredTruckRows.filter((entry: any) => {
        const entryDate = new Date(entry?.date || entry?.entry_date || entry?.createdAt || 0);
        return entryDate >= start && entryDate <= end;
      });
    },
    [filteredTruckRows]
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const entriesForRange = getEntriesForRange(downloadRange);
      const debitTotal = entriesForRange
        .filter((entry: any) => String(entry?.direction || "").toUpperCase() === "EXPENSE")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const creditTotal = entriesForRange
        .filter((entry: any) => String(entry?.direction || "").toUpperCase() === "INCOME")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const difference = debitTotal - creditTotal;

      const rowsHtml = entriesForRange
        .map((entry: any, index: number) => {
          const direction = String(entry?.direction || "").toUpperCase();
          const isDebit = direction === "EXPENSE";
          const debit = isDebit ? `₹ ${Number(entry.amount || 0).toLocaleString()}` : "";
          const credit = !isDebit ? `₹ ${Number(entry.amount || 0).toLocaleString()}` : "";
          const title = entry.notes || formatLabel(entry.transactionSubtype || entry.category || "Entry");
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatDate(entry.date))}</td>
            <td>${escapeHtml(title)}</td>
            <td class="debit">${escapeHtml(debit)}</td>
            <td class="credit">${escapeHtml(credit)}</td>
          </tr>`;
        })
        .join("");

      const totalsHtml = `
          <tr class="totals">
            <td colspan="3">Totals</td>
            <td class="debit">₹ ${debitTotal.toLocaleString()}</td>
            <td class="credit">₹ ${creditTotal.toLocaleString()}</td>
          </tr>
          <tr class="difference">
            <td colspan="3">Difference (Debit - Credit)</td>
            <td colspan="2" class="diff">${difference >= 0 ? "" : "-"}₹ ${Math.abs(difference).toLocaleString()}</td>
          </tr>`;

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0; font-size: 22px; }
          .sub { margin-top: 4px; color: #6b7280; font-size: 12px; }
          .cards { margin-top: 12px; display: flex; gap: 10px; }
          .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
          .label { color: #6b7280; font-size: 11px; }
          .value { margin-top: 4px; font-size: 15px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
          th { background: #111827; color: white; text-align: left; padding: 8px; }
          td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
          .debit { color: #b91c1c; font-weight: 700; }
          .credit { color: #15803d; font-weight: 700; }
          .totals td { font-weight: 700; background: #f9fafb; }
          .difference td { font-weight: 800; background: #f3f4f6; }
          .diff { text-align: left; }
          .disclaimer { margin-top: 16px; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Daily Khata Ledger</h1>
        <div class="sub">${escapeHtml(selectedTruck?.registration_number || "Truck")}</div>
        <div class="sub">Period: ${escapeHtml(formatDate(downloadRange.startDate))} - ${escapeHtml(formatDate(downloadRange.endDate))}</div>
        <div class="cards">
          <div class="card"><div class="label">Debit</div><div class="value">₹ ${debitTotal.toLocaleString()}</div></div>
          <div class="card"><div class="label">Credit</div><div class="value">₹ ${creditTotal.toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${(rowsHtml || `<tr><td colspan="5">No entries found for this range.</td></tr>`) + totalsHtml}</tbody>
        </table>
        <div class="disclaimer">Disclaimer: Transactions exist before and after this date range.</div>
      </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const truckName = (selectedTruck?.registration_number || "truck").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32);
      const targetUri = `${FileSystem.documentDirectory}Daily-Khata-${truckName}-${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(targetUri);
      else Alert.alert("Report Ready", `Saved at: ${targetUri}`);
      setShowDownloadSheet(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate daily khata PDF");
    } finally {
      setDownloading(false);
    }
  };

  const applyDownloadDate = (field: "start" | "end", selectedDate: Date) => {
    if (field === "start") {
      setDownloadRange((prev) => ({
        startDate: selectedDate,
        endDate: prev.endDate < selectedDate ? selectedDate : prev.endDate,
      }));
      return;
    }
    setDownloadRange((prev) => ({
      startDate: prev.startDate > selectedDate ? selectedDate : prev.startDate,
      endDate: selectedDate,
    }));
  };

  const openDownloadDatePicker = (field: "start" | "end") => {
    setDownloadDateField(field);
  };

  const closeDownloadDatePicker = () => setDownloadDateField(null);

  const onSave = async () => {
    if (!truckId) {
      Alert.alert("Truck Required", "Select a truck.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    await addRunningExpense({
      truckId,
      category: expenseCategory,
      amount: Number(amount),
      paymentMode,
      notes,
      date: new Date().toISOString(),
      ...(expenseCategory === "FUEL" ? {
        litres: litres ? Number(litres) : undefined,
        kmReading: kmReading ? Number(kmReading) : undefined
      } : {}),
    });

    setShowAdd(false);
    setAmount("");
    setLitres("");
    setKmReading("");
    setNotes("");
    setPaymentMode("CASH");
    await loadData();
  };

  const openAddModal = (cat: string) => {
    setExpenseCategory(cat);
    setShowAdd(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('runningExpenses')}</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
              {selectedTruck?.registration_number || "Truck"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowDownloadSheet(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Download size={16} color={colors.foreground} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Info Header */}
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
            TOTAL EXPENSES
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View>
              <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}> ₹ {monthlyExpense.toLocaleString()}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                Total daily khata costs
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {RUNNING_ACTIONS.map((type) => (
            <View key={`card-${type}`} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>
                {type === "FASTAG" ? "FASTAG" : type}
              </Text>
              <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: "800" }}> ₹ {totalsByType[type].toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {(["ALL", ...RUNNING_ACTIONS] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setActiveCategoryFilter(type)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: activeCategoryFilter === type ? colors.primary : colors.border,
                backgroundColor: activeCategoryFilter === type ? colors.primary : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: activeCategoryFilter === type ? colors.primaryForeground : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                {type === "FASTAG" ? "Fastag" : formatLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ledger Entries */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          {activeCategoryFilter === "ALL" ? "TRANSACTION" : formatLabel(activeCategoryFilter).toUpperCase()} HISTORY
        </Text>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} width="100%" height={86} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {filteredTruckRows.length === 0 && !financeLoading && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 30, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground }}>No {activeCategoryFilter === "ALL" ? "daily khata" : formatLabel(activeCategoryFilter).toLowerCase()} entries found for this month.</Text>
          </View>
        )}

        {!showInitialSkeleton && filteredTruckRows.map((item: any) => {
          const type = String(item.transactionSubtype || item.category || "Expense").toUpperCase();
          const isFuel = type === "FUEL";

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
                        backgroundColor: isFuel ? colors.warningSoft : colors.border + "50",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: isFuel ? colors.warning : colors.mutedForeground,
                        }}
                      >
                        {formatLabel(type).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>{item.paymentMode || "Cash"}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>
                    {item.notes || formatLabel(type)}
                  </Text>
                  {isFuel && (item.litres || item.kmReading) && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 2 }}>
                      {item.litres && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="beaker-outline" size={12} color={colors.mutedForeground} />
                          <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '600' }}>{item.litres}L</Text>
                        </View>
                      )}
                      {item.kmReading && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="speedometer-outline" size={12} color={colors.mutedForeground} />
                          <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '600' }}>{item.kmReading} KM</Text>
                        </View>
                      )}
                    </View>
                  )}
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{formatDate(item.date)}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.destructive }}>
                  -₹ {Number(item.amount || 0).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FinanceFAB onPress={() => openAddModal(activeCategoryFilter === "ALL" ? "FUEL" : activeCategoryFilter)} />

      {/* Add Expense Modal */}
      <BottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Daily Khata"
        subtitle={selectedTruck?.registration_number || "Vehicle"}
        maxHeight="90%"
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={120}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Category selector */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>CATEGORY</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {RUNNING_ACTIONS.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setExpenseCategory(cat)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: expenseCategory === cat ? colors.primary : colors.border + '30',
                  backgroundColor: expenseCategory === cat ? colors.primary : (isDark ? colors.card : colors.secondary + '40'),
                  alignItems: "center",
                }}
              >
                <Text style={{ color: expenseCategory === cat ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>
                  {cat === "FASTAG" ? "Fastag" : formatLabel(cat)}
                </Text>
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
              backgroundColor: colors.input,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border + '30',
              height: 80,
              marginBottom: 20
            }}
          />

          {/* Fuel specific fields */}
          {expenseCategory === "FUEL" && (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>LITRES</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground + '60'}
                  keyboardType="numeric"
                  value={litres}
                  onChangeText={setLitres}
                  className="rounded-2xl p-4 text-base font-bold"
                  style={{
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border + '30'
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>KM READING</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground + '60'}
                  keyboardType="numeric"
                  value={kmReading}
                  onChangeText={setKmReading}
                  className="rounded-2xl p-4 text-base font-bold"
                  style={{
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border + '30'
                  }}
                />
              </View>
            </View>
          )}

          {/* Payment Mode chips */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {["CASH", "BANK"].map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setPaymentMode(mode)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: paymentMode === mode ? colors.primary : colors.border + '30',
                  backgroundColor: paymentMode === mode ? colors.primary : (isDark ? colors.card : colors.secondary + '40'),
                  alignItems: "center"
                }}
              >
                <Text style={{ color: paymentMode === mode ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>REMARKS (OPTIONAL)</Text>
          <TextInput
            placeholder="Trip notes..."
            placeholderTextColor={colors.mutedForeground + '60'}
            value={notes}
            onChangeText={setNotes}
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: colors.input,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border + '30',
              marginBottom: 28,
              minHeight: 80
            }}
          />

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={onSave}
              style={{ backgroundColor: colors.primary }}
              className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 18 }} className="text-center font-black">SAVE EXPENSE</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </BottomSheet>

      <BottomSheet
        visible={showDownloadSheet}
        onClose={() => {
          setShowDownloadSheet(false);
          closeDownloadDatePicker();
        }}
        title="Download Ledger"
        subtitle="Choose a date range"
        maxHeight="70%"
      >
        <View style={{ gap: 14, paddingBottom: 10 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            Select the period you want to include in the PDF.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => openDownloadDatePicker("start")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Calendar size={14} color={colors.mutedForeground} />
              <View>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Start</Text>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>{formatDate(downloadRange.startDate)}</Text>
              </View>
            </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openDownloadDatePicker("end")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Calendar size={14} color={colors.mutedForeground} />
              <View>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>End</Text>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>{formatDate(downloadRange.endDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <DatePickerModal
            visible={downloadDateField === "start"}
            date={downloadRange.startDate}
            onClose={closeDownloadDatePicker}
            onChange={(selectedDate) => applyDownloadDate("start", selectedDate)}
          />

          <DatePickerModal
            visible={downloadDateField === "end"}
            date={downloadRange.endDate}
            onClose={closeDownloadDatePicker}
            onChange={(selectedDate) => applyDownloadDate("end", selectedDate)}
          />

          <TouchableOpacity
            onPress={handleDownload}
            disabled={downloading}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              opacity: downloading ? 0.7 : 1,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 14 }}>
              {downloading ? "Generating PDF..." : "Download PDF"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

function inputStyle(colors: any) {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.foreground,
    padding: 12,
    fontSize: 14,
  };
}
