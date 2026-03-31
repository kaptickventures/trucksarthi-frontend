import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { useKYC } from "../../hooks/useKYC";

export default function UpdateBankScreen() {
  const { colors, theme } = useThemeStore();
  const { user, updateUser, refreshUser } = useUser();
  const { verifyBank, loading } = useKYC();
  const isDark = theme === "dark";

  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const historyKey = useMemo(() => `kyc_history:${user?._id || "anonymous"}`, [user?._id]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(historyKey);
        if (!saved) return;
        const parsed = JSON.parse(saved) as { bank?: string[] };
        setHistory(Array.isArray(parsed?.bank) ? parsed.bank : []);
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, [historyKey]);

  const pushBankHistory = async (value: string) => {
    const normalized = (value || "").replace(/\s+/g, "");
    if (!normalized) return;
    const next = [normalized, ...history.filter((item) => item !== normalized)].slice(0, 6);
    setHistory(next);
    try {
      const saved = await AsyncStorage.getItem(historyKey);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, bank: next };
      await AsyncStorage.setItem(historyKey, JSON.stringify(merged));
    } catch {
      // ignore history persistence errors
    }
  };

  useEffect(() => {
    setAccountNumber(user?.account_number || "");
    setIfsc(user?.ifsc_code || "");
    setUpiId(user?.upiId || "");
  }, [user?.account_number, user?.ifsc_code, user?.upiId]);

  const handleVerify = async () => {
    const cleanAccount = (accountNumber || "").replace(/\s+/g, "");
    const cleanIfsc = (ifsc || "").trim().toUpperCase();
    const cleanUpi = (upiId || "").trim();

    if (!cleanAccount || !cleanIfsc) {
      Alert.alert("Error", "Please enter account number and IFSC code");
      return;
    }

    try {
      const result = await verifyBank(cleanAccount, cleanIfsc, user?.account_holder_name || user?.name);
      if (!result?.verified) {
        Alert.alert("Verification Failed", result?.message || "Invalid bank details");
        return;
      }

      await pushBankHistory(cleanAccount);

      const bankData = result?.data || {};
      await updateUser({
        account_number: cleanAccount,
        ifsc_code: cleanIfsc,
        upiId: cleanUpi || undefined,
        bank_name: bankData.bank_name || bankData.bankName || user?.bank_name,
        account_holder_name: bankData.name_at_bank || bankData.nameAtBank || user?.account_holder_name,
        is_bank_verified: true,
        kyc_data: {
          ...(user?.kyc_data || {}),
          bank_details: bankData,
        },
      } as any);

      await refreshUser();
      Alert.alert("Success", "Bank and UPI details updated successfully.");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to verify bank details");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
      >
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "900" }}>Update Bank</Text>
        <Text style={{ color: colors.mutedForeground, marginTop: 4, marginBottom: 18 }}>
          Verify bank details and update UPI ID.
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
            gap: 12,
          }}
        >
          <View>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>ACCOUNT NUMBER</Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter bank account number"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                fontWeight: "600",
              }}
            />
          </View>

          <View>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>IFSC CODE</Text>
            <TextInput
              value={ifsc}
              onChangeText={(v) => setIfsc(v.toUpperCase())}
              placeholder="SBIN0001234"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                fontWeight: "700",
              }}
            />
          </View>

          <View>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>UPI ID</Text>
            <TextInput
              value={upiId}
              onChangeText={setUpiId}
              placeholder="example@upi"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            style={{
              marginTop: 4,
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 15 }}>Verify and Save Bank</Text>
            )}
          </TouchableOpacity>
        </View>

        {!!user?.is_bank_verified && !!user?.kyc_data?.bank_details && (
          <View
            style={{
              marginTop: 16,
              borderWidth: 1,
              borderColor: colors.success,
              backgroundColor: colors.successSoft,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={{ color: colors.success, fontWeight: "800", marginLeft: 8 }}>Verified Bank Details</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Account Holder: {user?.account_holder_name || user?.kyc_data?.bank_details?.name_at_bank || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Account Number: {user?.account_number || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Bank: {user?.bank_name || user?.kyc_data?.bank_details?.bank_name || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              IFSC: {String(user?.ifsc_code || "-").toUpperCase()}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Status: {user?.kyc_data?.bank_details?.account_status || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>
              UPI ID: {user?.upiId || "-"}
            </Text>
          </View>
        )}

        {history.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" }}>
              Previously Used Bank Accounts
            </Text>
            <View style={{ gap: 10 }}>
              {history.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setAccountNumber(item)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 14 }}>{item}</Text>
                  <Text style={{ color: colors.mutedForeground, marginTop: 4, fontSize: 11 }}>Tap to use</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
