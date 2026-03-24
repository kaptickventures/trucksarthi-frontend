import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "qrcode";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import API from "../api/axiosInstance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { postLoginFlow } from "../../hooks/useAuth";
import { useAuth } from "../../context/AuthContext";

type SessionState = {
  sessionId: string;
  secret: string;
  qrData: string;
  expiresAt: string;
  ttlMinutes: number;
};

export default function DesktopQrScreen() {
  const { colors } = useThemeStore();
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [qrImage, setQrImage] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "approved" | "expired" | "error">("idle");
  const [errorText, setErrorText] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const createSession = async () => {
    try {
      stopPolling();
      setStatus("loading");
      setErrorText("");
      const res = await API.post("/api/auth/desktop/session");
      setSession(res.data);
      const dataUrl = await QRCode.toDataURL(res.data.qrData, {
        margin: 1,
        width: 280,
        color: {
          dark: "#111111",
          light: "#FFFFFF",
        },
      });
      setQrImage(dataUrl);
      setStatus("pending");
    } catch (err: any) {
      setErrorText(err?.response?.data?.error || err?.message || t("desktopQrFailed"));
      setStatus("error");
    }
  };

  const pollSession = async () => {
    if (!session?.sessionId || !session.secret) return;
    try {
      const res = await API.get(
        `/api/auth/desktop/session/${session.sessionId}?secret=${encodeURIComponent(session.secret)}`
      );
      const nextStatus = res.data?.status;
      if (nextStatus === "approved" && res.data?.token) {
        stopPolling();
        await AsyncStorage.setItem("userToken", res.data.token);
        await refreshUser();
        setStatus("approved");
        await postLoginFlow(router);
        return;
      }
      if (nextStatus === "expired") {
        stopPolling();
        setStatus("expired");
      }
    } catch (err: any) {
      if (err?.response?.status === 410) {
        stopPolling();
        setStatus("expired");
        return;
      }
      setErrorText(err?.response?.data?.error || err?.message || t("desktopQrFailed"));
      setStatus("error");
      stopPolling();
    }
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace("/(stack)/desktop-auth" as any);
      return;
    }
    createSession();
    return () => stopPolling();
  }, [router]);

  useEffect(() => {
    if (status === "pending" && session) {
      stopPolling();
      pollRef.current = setInterval(pollSession, 2000);
    }
    return () => stopPolling();
  }, [status, session?.sessionId, session?.secret]);

  const expiresText = useMemo(() => {
    if (!session?.expiresAt) return "";
    const date = new Date(session.expiresAt);
    return `${t("desktopQrExpires")} ${date.toLocaleTimeString()}`;
  }, [session?.expiresAt, t]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 24,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          borderRadius: 24,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text className="text-xl font-semibold" style={{ color: colors.foreground }}>
          {t("desktopQrTitle")}
        </Text>
        <Text className="mt-2 text-sm text-center" style={{ color: colors.mutedForeground }}>
          {t("desktopQrSubtitle")}
        </Text>

        <View
          style={{
            marginTop: 18,
            width: 280,
            height: 280,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {status === "loading" && <ActivityIndicator color={colors.primary} size="large" />}
          {status !== "loading" && qrImage.length > 0 && (
            <View
              style={{
                width: 260,
                height: 260,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Image
                source={{ uri: qrImage }}
                style={{ width: 260, height: 260 }}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <View style={{ marginTop: 14 }}>
          {status === "pending" && (
            <Text className="text-base text-center" style={{ color: colors.mutedForeground }}>
              {t("desktopQrWaiting")}
            </Text>
          )}
          {status === "approved" && (
            <Text className="text-base text-center" style={{ color: colors.primary }}>
              {t("desktopQrApproved")}
            </Text>
          )}
          {(status === "expired" || status === "error") && (
            <Text className="text-base text-center" style={{ color: colors.destructive }}>
              {errorText || t("desktopQrExpired")}
            </Text>
          )}
        </View>

        {expiresText ? (
          <Text className="mt-3 text-xs" style={{ color: colors.mutedForeground }}>
            {expiresText}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={createSession}
        className="mt-6 py-3 rounded-full items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-base font-semibold" style={{ color: colors.primaryForeground }}>
          {t("desktopQrRefresh")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
