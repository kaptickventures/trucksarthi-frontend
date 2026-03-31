import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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
import { Calendar, Download } from "lucide-react-native";
import { useThemeStore } from "../../hooks/useThemeStore";
import useFinance from "../../hooks/useFinance";
import { formatDate, formatLabel } from "../../lib/utils";

const EXPENSE_CATEGORIES = ["DOCUMENT", "SERVICE", "REPAIR"];
const INCOME_CATEGORIES = ["ASSET_SALE", "SCRAP_SALE", "REFUND", "OTHER_INCOME"];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function MiscTransactionsScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { loading, transactions, fetchTransactions, addTransaction } = useFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [entryType, setEntryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [showDownloadSheet, setShowDownloadSheet] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDateField, setDownloadDateField] = useState<"start" | "end" | null>(null);
  const [downloadRange, setDownloadRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), []);

  const load = useCallback(async () => {
    await fetchTransactions({
      sourceModule: "MISC",
      direction: activeFilter === "ALL" ? "" : activeFilter,
      startDate: monthStart,
      endDate: new Date().toISOString(),
    });
  }, [fetchTransactions, activeFilter, monthStart]);

  useEffect(() => {
    load();
  }, [load]);



  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    await addTransaction({
      sourceModule: "MISC",
      direction: entryType,
      paymentMode,
      amount: Number(amount),
      notes,
      date: new Date().toISOString(),
    });

    setAmount("");
    setNotes("");
    setShowAdd(false);
    await load();
  };

  const totals = useMemo(() => {
    return (transactions || []).reduce(
      (acc, t: any) => {
        if (t.direction === "INCOME") acc.income += Number(t.amount || 0);
        if (t.direction === "EXPENSE") acc.expense += Number(t.expense_amount || t.amount || 0);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let rows = (transactions || []).filter((t: any) => t.sourceModule === "MISC");
    if (activeFilter !== "ALL") {
      rows = rows.filter((t: any) => t.direction === activeFilter);
    }
    return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, activeFilter]);
  const showInitialSkeleton = loading && !refreshing && filteredTransactions.length === 0;

  const getEntriesForRange = useCallback(
    (range: { startDate: Date; endDate: Date }) => {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      return filteredTransactions.filter((entry: any) => {
        const entryDate = new Date(entry?.date || entry?.entry_date || entry?.createdAt || 0);
        return entryDate >= start && entryDate <= end;
      });
    },
    [filteredTransactions]
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
          const title = entry.notes || formatLabel(entry.category || "Entry");
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
        <h1>Misc Khata Ledger</h1>
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
      const targetUri = `${FileSystem.documentDirectory}Misc-Khata-${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(targetUri);
      else Alert.alert("Report Ready", `Saved at: ${targetUri}`);
      setShowDownloadSheet(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate misc khata PDF");
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Misc Transactions</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>View and manage other entries</Text>
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

        {/* Summary Info */}
        {showInitialSkeleton ? (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <Skeleton style={{ flex: 1, height: 75, borderRadius: 16 }} />
            <Skeleton style={{ flex: 1, height: 75, borderRadius: 16 }} />
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>INCOME</Text>
              <Text style={{ color: colors.success, fontSize: 18, fontWeight: "800" }}> ₹ {totals.income.toLocaleString()}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>EXPENSE</Text>
              <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: "800" }}> ₹ {totals.expense.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Filter Pills */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {["ALL", "EXPENSE", "INCOME"].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f as any)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: activeFilter === f ? colors.primary : colors.border,
                backgroundColor: activeFilter === f ? colors.primary : "transparent",
              }}
            >
              <Text style={{ color: activeFilter === f ? colors.primaryForeground : colors.foreground, fontWeight: "700", fontSize: 12 }}>
                {formatLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedForeground, marginBottom: 12, marginLeft: 4 }}>
          RECENT TRANSACTIONS
        </Text>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} width="100%" height={88} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {!showInitialSkeleton && filteredTransactions.map((item: any) => {
          const isIncome = item.direction === "INCOME";
          return (
            <View
              key={item._id}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
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
                        backgroundColor: isIncome ? colors.successSoft : colors.destructiveSoft,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: isIncome ? colors.success : colors.destructive,
                        }}
                      >
                        {formatLabel(item.category).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: "600" }}>
                      {item.paymentMode || "Cash"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>
                    {item.notes || formatLabel(item.category)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "800", color: isIncome ? colors.success : colors.destructive }}>
                  {isIncome ? "+" : "-"}₹ {Number(item.amount || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}

        {!loading && filteredTransactions.length === 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 30, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground }}>No transactions found.</Text>
          </View>
        )}
      </ScrollView>

      <FinanceFAB onPress={() => setShowAdd(true)} />

      <BottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Transaction"
        subtitle="Manage miscellaneous entries"
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
          {/* Type Toggle */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setEntryType("INCOME")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: entryType === "INCOME" ? colors.success : colors.border + '30',
                backgroundColor: entryType === "INCOME" ? colors.success : (isDark ? colors.card : colors.secondary + '40'),
                alignItems: "center",
              }}
            >
              <Text style={{ color: entryType === "INCOME" ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEntryType("EXPENSE")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: entryType === "EXPENSE" ? colors.destructive : colors.border + '30',
                backgroundColor: entryType === "EXPENSE" ? colors.destructive : (isDark ? colors.card : colors.secondary + '40'),
                alignItems: "center",
              }}
            >
              <Text style={{ color: entryType === "EXPENSE" ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 13, textTransform: 'uppercase' }}>Expense</Text>
            </TouchableOpacity>
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
              marginBottom: 24
            }}
          />



          {/* Payment Mode */}
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>PAYMENT MODE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
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

          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>DETAILS</Text>
          <TextInput
            placeholder="e.g. Parts purchase or Client refund"
            placeholderTextColor={colors.mutedForeground + '60'}
            value={notes}
            onChangeText={setNotes}
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: colors.input,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border + '30',
              marginBottom: 32,
              minHeight: 80
            }}
          />

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={submit}
              style={{ backgroundColor: colors.primary }}
              className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 18 }} className="text-center font-black">SAVE ENTRY</Text>
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
