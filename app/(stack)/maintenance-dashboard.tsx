import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function MaintenanceDashboardScreen() {
  const { truckId } = useLocalSearchParams<{ truckId?: string }>();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { trucks, fetchTrucks } = useTrucks();
  const { transactions, fetchTransactions, addMaintenanceExpense, loading: financeLoading } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "DOCUMENT" | "SERVICE_REPAIR">("ALL");
  const [entryType, setEntryType] = useState<string>("SERVICE_REPAIR");
  const [amount, setAmount] = useState("");
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

  const getEntriesForRange = useCallback(
    (range: { startDate: Date; endDate: Date }) => {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      return truckRows.filter((entry: any) => {
        const entryDate = new Date(entry?.date || entry?.entry_date || entry?.createdAt || 0);
        return entryDate >= start && entryDate <= end;
      });
    },
    [truckRows]
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
          const title = entry.notes || (String(entry.serviceType || entry.category || "").toUpperCase() === "DOCUMENT" ? "Document Processing" : "Service & Repair");
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
        <h1>Maintenance Khata Ledger</h1>
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
      const targetUri = `${FileSystem.documentDirectory}Maintenance-Khata-${truckName}-${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(targetUri);
      else Alert.alert("Report Ready", `Saved at: ${targetUri}`);
      setShowDownloadSheet(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate maintenance khata PDF");
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
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: field === "start" ? downloadRange.startDate : downloadRange.endDate,
        mode: "date",
        display: "calendar",
        onChange: (_, selectedDate) => {
          if (selectedDate) applyDownloadDate(field, selectedDate);
        },
      });
      return;
    }
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('maintenance')}</Text>
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
            <Text style={{ color: colors.destructive, fontSize: 24, fontWeight: "800" }}> ₹ {lifetimeTotal.toLocaleString()}
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
                    color: filterType === f.value ? colors.primaryForeground : colors.foreground,
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
                        backgroundColor: isDocument ? colors.infoSoft : colors.destructiveSoft,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: isDocument ? colors.info : colors.destructive,
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
                  -? {Number(item.amount || 0).toLocaleString()}
                </Text>
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
                <Text style={{ color: entryType === action.value ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>AMOUNT (â‚¹)</Text>
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

          {/* Payment Mode chips */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {["CASH", "BANK"].map((mode) => (
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
                <Text style={{ color: paymentMode === mode ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>{mode}</Text>
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
              backgroundColor: colors.input,
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
              <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 18 }} className="text-center font-black">SAVE RECORD</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </BottomSheet>

      <BottomSheet
        visible={showDownloadSheet}
        onClose={() => {
          setShowDownloadSheet(false);
          setDownloadDateField(null);
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

          {Platform.OS === "ios" && downloadDateField && (
            <Modal transparent animationType="slide" visible onRequestClose={closeDownloadDatePicker}>
              <View style={{ flex: 1, backgroundColor: colors.overlay35, justifyContent: "flex-end" }}>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    paddingBottom: 20,
                    borderTopWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <TouchableOpacity onPress={closeDownloadDatePicker}>
                      <Text style={{ color: colors.destructive, fontWeight: "600" }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closeDownloadDatePicker}>
                      <Text style={{ color: colors.primary, fontWeight: "700" }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={downloadDateField === "start" ? downloadRange.startDate : downloadRange.endDate}
                    mode="date"
                    display="inline"
                    onChange={(_, selectedDate) => {
                      if (selectedDate) applyDownloadDate(downloadDateField, selectedDate);
                    }}
                  />
                </View>
              </View>
            </Modal>
          )}

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
