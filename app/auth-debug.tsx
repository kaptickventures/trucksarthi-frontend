import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "./api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getUserRole } from "../hooks/useAuth";
import { useThemeStore } from "../hooks/useThemeStore";

export default function AuthDebugScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user, loading, refreshUser } = useAuth();
  const [tokenInfo, setTokenInfo] = useState("loading...");
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const role = getUserRole(user);

  const loadDebugInfo = useCallback(async () => {
    setChecking(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      setTokenInfo(token ? `${token.slice(0, 18)}... (${token.length} chars)` : "missing");

      if (user?._id && role === "fleet_owner") {
        const res = await API.get(`/api/users/check-profile/${user._id}`);
        setProfileCompleted(Boolean(res.data?.profileCompleted));
      } else {
        setProfileCompleted(null);
      }
    } catch (err: any) {
      setProfileCompleted(null);
      setTokenInfo(`error: ${err?.message || "unknown"}`);
    } finally {
      setChecking(false);
    }
  }, [role, user?._id]);

  useEffect(() => {
    loadDebugInfo();
  }, [loadDebugInfo]);

  const targetRoute = useMemo(() => {
    if (!user) return "/auth/login";
    if (role === "driver") return "/(driver)/(tabs)";
    if (profileCompleted === true) return "/(tabs)/home";
    if (profileCompleted === false) return "/basic-details";
    return "waiting_profile_check";
  }, [profileCompleted, role, user]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>
          Auth Debug
        </Text>
        <Text style={{ color: colors.mutedForeground }}>
          Use this screen to verify role-based routing while backend redeploy is in progress.
        </Text>

        <DebugRow label="AuthContext loading" value={String(loading)} color={colors.foreground} />
        <DebugRow label="Token" value={tokenInfo} color={colors.foreground} />
        <DebugRow label="user_type (raw)" value={String(user?.user_type ?? "null")} color={colors.foreground} />
        <DebugRow label="userType (raw)" value={String(user?.userType ?? "null")} color={colors.foreground} />
        <DebugRow label="Normalized Role" value={role} color={colors.foreground} />
        <DebugRow
          label="Profile Completed"
          value={profileCompleted === null ? "n/a" : String(profileCompleted)}
          color={colors.foreground}
        />
        <DebugRow label="Computed Target" value={targetRoute} color={colors.foreground} />

        <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 8 }}>Current User JSON</Text>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.foreground, fontFamily: "monospace" }}>
            {JSON.stringify(user, null, 2)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            await refreshUser();
            await loadDebugInfo();
          }}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          {checking ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "700" }}>Refresh Auth + Recompute</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (targetRoute !== "waiting_profile_check") {
              router.replace(targetRoute as any);
            }
          }}
          style={{
            backgroundColor: colors.foreground,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.background, fontWeight: "700" }}>Go To Computed Target</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DebugRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
      <Text style={{ color, opacity: 0.75, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color, fontWeight: "700", flexShrink: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

