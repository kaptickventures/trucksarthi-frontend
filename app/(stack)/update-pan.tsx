import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { useKYC } from "../../hooks/useKYC";

export default function UpdatePanScreen() {
  const { colors, theme } = useThemeStore();
  const { user, updateUser, refreshUser } = useUser();
  const { verifyPAN, loading } = useKYC();
  const isDark = theme === "dark";

  const [pan, setPan] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [selectedHistoryPan, setSelectedHistoryPan] = useState("");

  const historyKey = useMemo(() => `kyc_history:${user?._id || "anonymous"}`, [user?._id]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(historyKey);
        if (!saved) return;
        const parsed = JSON.parse(saved) as { pan?: string[] };
        setHistory(Array.isArray(parsed?.pan) ? parsed.pan : []);
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, [historyKey]);

  const pushPanHistory = async (value: string) => {
    const normalized = (value || "").trim().toUpperCase();
    if (!normalized) return;
    const next = [normalized, ...history.filter((item) => item !== normalized)].slice(0, 6);
    setHistory(next);
    try {
      const saved = await AsyncStorage.getItem(historyKey);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, pan: next };
      await AsyncStorage.setItem(historyKey, JSON.stringify(merged));
    } catch {
      // ignore history persistence errors
    }
  };

  useEffect(() => {
    setPan(user?.pan_number || "");
  }, [user?.pan_number]);

  const handleVerify = async () => {
    const normalizedPan = (pan || "").trim().toUpperCase();
    setSelectedHistoryPan(normalizedPan);
    if (normalizedPan.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit PAN number");
      return;
    }

    try {
      const result = await verifyPAN(normalizedPan);
      if (!result?.verified) {
        Alert.alert("Verification Failed", result?.message || "Invalid PAN details");
        return;
      }

      await pushPanHistory(normalizedPan);

      const verifiedName = result?.data?.registered_name;
      await updateUser({
        pan_number: normalizedPan,
        name_as_on_pan: verifiedName,
        is_pan_verified: true,
        kyc_data: {
          ...(user?.kyc_data || {}),
          pan_details: result?.data || {},
        },
      } as any);

      await refreshUser();
      Alert.alert("Success", "PAN updated and verified successfully.");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to verify PAN");
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
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "900" }}>Update PAN</Text>
        <Text style={{ color: colors.mutedForeground, marginTop: 4, marginBottom: 18 }}>
          Verify and save PAN details for your account.
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
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>PAN NUMBER</Text>
          <TextInput
            value={pan}
            onChangeText={(v) => setPan(v.toUpperCase())}
            placeholder="ABCDE1234F"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            maxLength={10}
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

          {!!user?.pan_number && (
            <Text style={{ color: colors.mutedForeground, marginTop: 10, fontSize: 12 }}>
              Current PAN: {String(user.pan_number).toUpperCase()}
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
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 15 }}>Verify and Save PAN</Text>
            )}
          </TouchableOpacity>
        </View>

        {!!user?.is_pan_verified && !!user?.kyc_data?.pan_details && (
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
              <Text style={{ color: colors.success, fontWeight: "800", marginLeft: 8 }}>Verified PAN Details</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>PAN: {String(user?.pan_number || "-").toUpperCase()}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>
              Name: {user?.kyc_data?.pan_details?.registered_name || "-"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>
              Type: {user?.kyc_data?.pan_details?.type || user?.kyc_data?.pan_details?.pan_type || "-"}
            </Text>
          </View>
        )}

        {history.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" }}>
              Previously Used PAN
            </Text>
            <View style={{ gap: 10 }}>
              {history.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setPan(item);
                    setSelectedHistoryPan(item);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.success,
                    backgroundColor: colors.successSoft,
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={{ color: colors.success, fontWeight: "800", marginLeft: 8 }}>
                      {selectedHistoryPan === item ? "Selected PAN" : "Previous PAN"}
                    </Text>
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: 12, marginBottom: 4 }}>PAN: {item}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>
                    {selectedHistoryPan === item ? "Using this PAN in input." : "Tap to use this PAN"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
