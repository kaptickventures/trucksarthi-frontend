import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
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
import { Calendar, Download, Pencil } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "../../components/BottomSheet";
import { Skeleton } from "../../components/Skeleton";
import FinanceFAB from "../../components/finance/FinanceFAB";
import useDrivers from "../../hooks/useDriver";
import useDriverFinance, { TransactionNature } from "../../hooks/useDriverFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate, formatPhoneNumber, getFileUrl } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";

type TabType = "ALL" | "TO_DRIVER" | "DRIVER_SPENDS";
type QuickType = "ADVANCE" | "EXPENSE";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function DriverLedgerDetailScreen() {
  const { driverId } = useLocalSearchParams<{ driverId?: string | string[] }>();
  const id = Array.isArray(driverId) ? driverId[0] : driverId;
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { drivers, fetchDrivers, loading: driversLoading, uploadLicense, uploadAadhaar, uploadProfilePicture } = useDrivers();
  const { entries, loading, fetchDriverLedger, addLedgerEntry } = useDriverFinance();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [quickType, setQuickType] = useState<QuickType>("ADVANCE");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [showDownloadSheet, setShowDownloadSheet] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDateField, setDownloadDateField] = useState<"start" | "end" | null>(null);
  const [downloadRange, setDownloadRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const driver = useMemo(() => (drivers || []).find((d) => d._id === id), [drivers, id]);

  const load = useCallback(async () => {
    if (!id) return;
    await Promise.all([fetchDrivers(), fetchDriverLedger(id)]);
  }, [id, fetchDrivers, fetchDriverLedger]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const normalized = useMemo(() => {
    return [...(entries || [])]
      .map((entry: any) => {
        const transactionNature = String(entry?.transaction_nature || "").toLowerCase();
        const title = String(entry?.title || "").toLowerCase();
        const isToDriver = transactionNature === "received_by_driver" || title.includes("owner_to_driver");
        return {
          ...entry,
          entryDate: entry?.entry_date || entry?.createdAt || entry?.date,
          type: isToDriver ? "TO_DRIVER" : "DRIVER_SPENDS",
          amount: Number(entry?.amount || 0),
        };
      })
      .sort((a: any, b: any) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [entries, id]);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return normalized;
    return normalized.filter((entry: any) => entry.type === activeTab);
  }, [normalized, activeTab]);

  const totals = useMemo(() => {
    const advances = normalized
      .filter((entry: any) => entry.type === "TO_DRIVER")
      .reduce((sum: number, entry: any) => sum + entry.amount, 0);
    const expenses = normalized
      .filter((entry: any) => entry.type === "DRIVER_SPENDS")
      .reduce((sum: number, entry: any) => sum + entry.amount, 0);
    return { advances, expenses, balance: advances - expenses };
  }, [normalized]);

  const showInitialSkeleton = (loading || driversLoading) && !refreshing && filtered.length === 0;

  const getEntriesForRange = useCallback(
    (range: { startDate: Date; endDate: Date }) => {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      return normalized.filter((entry: any) => {
        const entryDate = new Date(entry.entryDate || entry.date || entry.createdAt || 0);
        return entryDate >= start && entryDate <= end;
      });
    },
    [normalized]
  );

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const entriesForRange = getEntriesForRange(downloadRange);
      const debitTotal = entriesForRange
        .filter((entry: any) => entry.type === "TO_DRIVER")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const creditTotal = entriesForRange
        .filter((entry: any) => entry.type === "DRIVER_SPENDS")
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
      const balance = debitTotal - creditTotal;

      const rowsHtml = entriesForRange
        .map((entry: any, index: number) => {
          const isDebit = entry.type === "TO_DRIVER";
          const debit = isDebit ? `Rs ${Number(entry.amount || 0).toLocaleString()}` : "";
          const credit = !isDebit ? `Rs ${Number(entry.amount || 0).toLocaleString()}` : "";
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatDate(entry.entryDate))}</td>
            <td>${escapeHtml(entry.remarks || (isDebit ? "To Driver" : "Driver Spend") || "-")}</td>
            <td class="debit">${escapeHtml(debit)}</td>
            <td class="credit">${escapeHtml(credit)}</td>
          </tr>`;
        })
        .join("");

      const totalsHtml = `
          <tr class="totals">
            <td colspan="3">Totals</td>
            <td class="debit">Rs ${debitTotal.toLocaleString()}</td>
            <td class="credit">Rs ${creditTotal.toLocaleString()}</td>
          </tr>
          <tr class="difference">
            <td colspan="3">Difference (Debit - Credit)</td>
            <td colspan="2" class="diff">${balance >= 0 ? "" : "-"}Rs ${Math.abs(balance).toLocaleString()}</td>
          </tr>`;

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0; font-size: 22px; }
          .driver { margin-top: 6px; font-size: 18px; font-weight: 800; }
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
        <h1>Driver Ledger</h1>
        <div class="driver">${escapeHtml(driver?.driver_name || driver?.name || "Driver")}</div>
        <div class="sub">Period: ${escapeHtml(formatDate(downloadRange.startDate))} - ${escapeHtml(formatDate(downloadRange.endDate))}</div>
        <div class="sub">Generated on: ${escapeHtml(formatDate(new Date()))}</div>
        <div class="cards">
          <div class="card"><div class="label">Debit</div><div class="value">Rs ${debitTotal.toLocaleString()}</div></div>
          <div class="card"><div class="label">Credit</div><div class="value">Rs ${creditTotal.toLocaleString()}</div></div>
          <div class="card"><div class="label">Balance</div><div class="value">${balance >= 0 ? "" : "-"}Rs ${Math.abs(balance).toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${(rowsHtml || `<tr><td colspan="5">No entries found for this range.</td></tr>`) + totalsHtml}</tbody>
        </table>
        <div class="disclaimer">Disclaimer: Transactions exist before and after this date range.</div>
      </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const driverName = (driver?.driver_name || driver?.name || "driver").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 32);
      const targetUri = `${FileSystem.documentDirectory}Driver-Ledger-${driverName}-${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(targetUri);
      else Alert.alert("Report Ready", `Saved at: ${targetUri}`);
      setShowDownloadSheet(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate driver ledger PDF");
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

  const submitQuickAdd = async () => {
    if (!id) return;
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }
    const transactionNature: TransactionNature = quickType === "ADVANCE" ? "received_by_driver" : "paid_by_driver";
    const remark = `${quickType} | ${purpose || "General"} | ${paymentMode}`;
    await addLedgerEntry({
      driver_id: id,
      transaction_nature: transactionNature,
      counterparty_type: "owner",
      direction: transactionNature === "paid_by_driver" ? "to" : "from",
      amount: Number(amount),
      remarks: remark,
    });
    setShowAdd(false);
    setAmount("");
    setPurpose("");
    setPaymentMode("CASH");
    await load();
  };


  const handleUpload = async (type: "LICENSE" | "AADHAAR" | "PROFILE") => {
    if (!id) return;
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Allow access to your photos to upload documents.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.5,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName || `${type.toLowerCase()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      };
      if (type === "LICENSE") {
        await uploadLicense(id, file);
      } else if (type === "AADHAAR") {
        await uploadAadhaar(id, file);
      } else {
        await uploadProfilePicture(id, file);
      }

      Alert.alert(t('success'), t('uploadSuccess'));
      await load();
    } catch {
      Alert.alert(t('error'), t('uploadFailed'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{driver?.driver_name || driver?.name || "Driver"} {t('khata')}</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Track and manage driver ledger entries</Text>
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

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <TouchableOpacity
            onPress={() => setIsProfileExpanded((prev) => !prev)}
            activeOpacity={0.8}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginRight: 12,
                }}
              >
                {driver?.profile_picture_url ? (
                  <Image
                    source={{ uri: getFileUrl(driver.profile_picture_url) || "" }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700" }}>
                    Photo
                  </Text>
                )}
              </View>

	              <View style={{ flex: 1 }}>
	                <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>
	                  {driver?.driver_name || driver?.name || "Driver"}
	                </Text>
	                <Text style={{ color: colors.mutedForeground, marginTop: 2, fontSize: 13 }}>
                    {driver?.contact_number || driver?.phone ? formatPhoneNumber(driver?.contact_number || driver?.phone) : "-"}
	                </Text>
	              </View>
            </View>
            <Ionicons name={isProfileExpanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={{ color: totals.balance >= 0 ? colors.success : colors.destructive, marginTop: 8, fontWeight: "800", fontSize: 18 }}>
            Net Balance: Rs {Math.abs(totals.balance).toLocaleString()}
          </Text>

	          {isProfileExpanded && (
	            <View style={{ marginTop: 12, gap: 8 }}>
	              <View style={{ gap: 4 }} />

              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() =>
                      driver?.identity_card_url
                        ? setPreviewImage(getFileUrl(driver.identity_card_url))
                        : handleUpload("AADHAAR")
                    }
                    activeOpacity={0.85}
                    style={{
                      height: 120,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {driver?.identity_card_url ? (
                      <Image
                        source={{ uri: getFileUrl(driver.identity_card_url) || "" }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ color: colors.mutedForeground, fontWeight: "700", fontSize: 12 }}>
                        {t('tapToUpload') || "Tap to upload"}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() => handleUpload("AADHAAR")}
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        padding: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Pencil size={12} color="white" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                  <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "700", marginTop: 8, color: colors.mutedForeground }}>
                    {t('aadhaar') || "Aadhaar"}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() =>
                      driver?.license_card_url
                        ? setPreviewImage(getFileUrl(driver.license_card_url))
                        : handleUpload("LICENSE")
                    }
                    activeOpacity={0.85}
                    style={{
                      height: 120,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {driver?.license_card_url ? (
                      <Image
                        source={{ uri: getFileUrl(driver.license_card_url) || "" }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ color: colors.mutedForeground, fontWeight: "700", fontSize: 12 }}>
                        {t('tapToUpload') || "Tap to upload"}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() => handleUpload("LICENSE")}
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        padding: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Pencil size={12} color="white" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                  <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "700", marginTop: 8, color: colors.mutedForeground }}>
                    {t('license') || "License"}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() =>
                    (driver?.contact_number || driver?.phone) &&
                    Linking.openURL(`tel:${driver?.contact_number || driver?.phone}`)
                  }
                  style={{ flex: 1, backgroundColor: colors.muted, paddingVertical: 10, borderRadius: 12, alignItems: "center" }}
                >
                  <Text style={{ fontWeight: "700", fontSize: 13, color: colors.foreground }}>{t('call') || "Call"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const raw = driver?.contact_number || driver?.phone || "";
                    if (!raw) return;
                    const cleaned = raw.replace(/\D/g, "");
                    const waNumber = cleaned.length === 12 && cleaned.startsWith("91") ? cleaned : `91${cleaned.slice(-10)}`;
                    Linking.openURL(`https://wa.me/${waNumber}?text=Hello ${driver?.driver_name || driver?.name || "Driver"}`);
                  }}
                  style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 12, alignItems: "center" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="logo-whatsapp" size={16} color={colors.primaryForeground} />
                    <Text style={{ fontWeight: "700", fontSize: 13, color: colors.primaryForeground }}>
                      {t('whatsapp') || "WhatsApp"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <SummaryCard label="Advances" value={totals.advances} tone="green" />
          <SummaryCard label="Expenses" value={totals.expenses} tone="red" />
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {([
            { id: "ALL", label: "All" },
            { id: "TO_DRIVER", label: "To Driver" },
            { id: "DRIVER_SPENDS", label: "Driver Spends" },
          ] as { id: TabType; label: string }[]).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: activeTab === tab.id ? colors.primary : colors.border,
                backgroundColor: activeTab === tab.id ? colors.primary : "transparent",
                paddingVertical: 9,
                alignItems: "center",
              }}
            >
              <Text style={{ color: activeTab === tab.id ? "white" : colors.foreground, fontWeight: "700", fontSize: 11 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
          {showInitialSkeleton && (
            <View>
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} width="100%" height={58} borderRadius={10} style={{ marginBottom: 10 }} />
              ))}
            </View>
          )}

          {!showInitialSkeleton && filtered.map((entry: any) => {
            const isToDriver = entry.type === "TO_DRIVER";
            return (
              <View key={entry._id} style={{ borderTopWidth: entry === filtered[0] ? 0 : 1, borderTopColor: colors.border, paddingTop: entry === filtered[0] ? 0 : 10, marginTop: entry === filtered[0] ? 0 : 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                      {isToDriver ? "Advance To Driver" : "Driver Spend"}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {entry.remarks || "-"}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                      {formatDate(entry.entryDate)}
                    </Text>
                  </View>
                  <Text style={{ color: isToDriver ? colors.success : colors.destructive, fontWeight: "800" }}>
                    {isToDriver ? "+" : "-"}Rs {entry.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}

          {!showInitialSkeleton && filtered.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 10 }}>No ledger entries found.</Text>
          )}
        </View>
      </ScrollView>

      <FinanceFAB onPress={() => setShowAdd(true)} />

      <BottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Ledger Entry"
        subtitle={driver?.driver_name || "Driver"}
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
          <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>ENTRY TYPE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            {([
              { id: "ADVANCE", label: "Advance" },
              { id: "EXPENSE", label: "Expense" },
            ] as { id: QuickType; label: string }[]).map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setQuickType(type.id)}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: quickType === type.id ? colors.primary : colors.border + '30',
                  backgroundColor: quickType === type.id ? colors.primary : (isDark ? colors.card : colors.secondary + '40'),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: quickType === type.id ? "white" : colors.foreground, fontSize: 13, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Amount">
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
              }}
            />
          </Field>

          <Field label="Purpose">
            <TextInput
              placeholder="Trip diesel, advance, settlement..."
              placeholderTextColor={colors.mutedForeground + '60'}
              value={purpose}
              onChangeText={setPurpose}
              className="rounded-2xl p-4 text-base font-bold"
              style={{
                backgroundColor: isDark ? colors.card : colors.secondary + '40',
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border + '30',
              }}
            />
          </Field>

          <Field label="Payment Mode">
            <View style={{ flexDirection: "row", gap: 10 }}>
              {["CASH", "BANK"].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setPaymentMode(mode)}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: paymentMode === mode ? colors.primary : colors.border + '30',
                    backgroundColor: paymentMode === mode ? colors.primary : (isDark ? colors.card : colors.secondary + '40'),
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: paymentMode === mode ? "white" : colors.foreground, fontSize: 12, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={submitQuickAdd}
              style={{ backgroundColor: colors.primary }}
              className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }} className="text-center font-black">
                {loading ? "SAVING..." : "SAVE ENTRY"}
              </Text>
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
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
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

      <BottomSheet
        visible={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Document Preview"
      >
        <View style={{ paddingBottom: 20 }}>
          <Image
            source={{ uri: previewImage || "" }}
            style={{ width: "100%", height: 400, borderRadius: 20 }}
            resizeMode="contain"
          />
        </View>
      </BottomSheet>
    </View>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1" style={{ color: colors.mutedForeground }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "green" | "red" }) {
  const { colors } = useThemeStore();
  const color = tone === "green" ? colors.success : colors.destructive;
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
      <Text style={{ color, fontWeight: "800", fontSize: 14 }}>Rs {Number(value || 0).toLocaleString()}</Text>
    </View>
  );
}
