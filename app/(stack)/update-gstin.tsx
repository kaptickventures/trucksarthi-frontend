import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { useKYC } from "../../hooks/useKYC";

export default function UpdateGstinScreen() {
  const { colors, theme } = useThemeStore();
  const { user, updateUser, refreshUser } = useUser();
  const { verifyGSTIN, loading } = useKYC();
  const isDark = theme === "dark";

  const [gstin, setGstin] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const historyKey = useMemo(() => `kyc_history:${user?._id || "anonymous"}`, [user?._id]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(historyKey);
        if (!saved) return;
        const parsed = JSON.parse(saved) as { gstin?: string[] };
        setHistory(Array.isArray(parsed?.gstin) ? parsed.gstin : []);
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, [historyKey]);

  const pushGstinHistory = async (value: string) => {
    const normalized = (value || "").trim().toUpperCase();
    if (!normalized) return;
    const next = [normalized, ...history.filter((item) => item !== normalized)].slice(0, 6);
    setHistory(next);
    try {
      const saved = await AsyncStorage.getItem(historyKey);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, gstin: next };
      await AsyncStorage.setItem(historyKey, JSON.stringify(merged));
    } catch {
      // ignore history persistence errors
    }
  };

  useEffect(() => {
    setGstin(user?.gstin || "");
  }, [user?.gstin]);

  const handleVerify = async () => {
    const normalizedGstin = (gstin || "").trim().toUpperCase();
    if (normalizedGstin.length !== 15) {
      Alert.alert("Error", "Please enter a valid 15-digit GSTIN");
      return;
    }

    try {
      const result = await verifyGSTIN(normalizedGstin);
      if (!result?.verified) {
        Alert.alert("Verification Failed", result?.message || "Invalid GSTIN details");
        return;
      }

      await pushGstinHistory(normalizedGstin);

      const gstinData = result?.data || {};
      const preferredCompanyName = gstinData.trade_name_of_business || gstinData.legal_name_of_business;

      await updateUser({
        gstin: normalizedGstin,
        company_name: preferredCompanyName || user?.company_name,
        address: gstinData.principal_place_address || user?.address,
        is_gstin_verified: true,
        kyc_data: {
          ...(user?.kyc_data || {}),
          gstin_details: gstinData,
        },
      } as any);

      await refreshUser();
      Alert.alert("Success", "GSTIN updated and verified successfully.");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to verify GSTIN");
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
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "900" }}>Update GSTIN</Text>
        <Text style={{ color: colors.mutedForeground, marginTop: 4, marginBottom: 18 }}>
          Verify GST details and update business profile.
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>GSTIN</Text>
          <TextInput
            value={gstin}
            onChangeText={(v) => setGstin(v.toUpperCase())}
            placeholder="27ABCDE1234F1Z5"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            maxLength={15}
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

          {!!user?.gstin && (
            <Text style={{ color: colors.mutedForeground, marginTop: 10, fontSize: 12 }}>
              Current GSTIN: {String(user.gstin).toUpperCase()}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            style={{
              marginTop: 14,
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
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 15 }}>Verify and Save GSTIN</Text>
            )}
          </TouchableOpacity>
        </View>

        {history.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" }}>
              Previously Used GSTIN
            </Text>
            <View style={{ gap: 10 }}>
              {history.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setGstin(item)}
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

        {!!user?.is_gstin_verified && !!user?.kyc_data?.gstin_details && (
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
              <Text style={{ color: colors.success, fontWeight: "800", marginLeft: 8 }}>Verified GSTIN Details</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>GSTIN: {String(user?.gstin || "-").toUpperCase()}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Legal Name: {user?.kyc_data?.gstin_details?.legal_name_of_business || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Trade Name: {user?.kyc_data?.gstin_details?.trade_name_of_business || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Status: {user?.kyc_data?.gstin_details?.gst_in_status || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Constitution: {user?.kyc_data?.gstin_details?.constitution_of_business || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>
              Address: {user?.kyc_data?.gstin_details?.principal_place_address || "-"}
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
