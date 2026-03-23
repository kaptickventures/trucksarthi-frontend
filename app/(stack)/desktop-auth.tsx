import { CheckCircle2, QrCode, RotateCcw } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ExpoCamera from "expo-camera";
import * as Haptics from "expo-haptics";
import "../../global.css";
import API from "../api/axiosInstance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

type ParsedQr = { sessionId: string; secret: string };

const getCameraPermissionsCompat = async () => {
  const direct = (ExpoCamera as any).getCameraPermissionsAsync;
  const legacy = (ExpoCamera as any).Camera?.getCameraPermissionsAsync;
  if (typeof direct === "function") return direct();
  if (typeof legacy === "function") return legacy();
  return { granted: false };
};

const requestCameraPermissionsCompat = async () => {
  const direct = (ExpoCamera as any).requestCameraPermissionsAsync;
  const legacy = (ExpoCamera as any).Camera?.requestCameraPermissionsAsync;
  if (typeof direct === "function") return direct();
  if (typeof legacy === "function") return legacy();
  return { granted: false };
};

const parseQrPayload = (value: string): ParsedQr | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    const sessionId = url.searchParams.get("sessionId") || url.searchParams.get("session");
    const secret = url.searchParams.get("secret");
    if (sessionId && secret) return { sessionId, secret };
  } catch {}

  try {
    const json = JSON.parse(value);
    if (json?.sessionId && json?.secret) {
      return { sessionId: String(json.sessionId), secret: String(json.secret) };
    }
  } catch {}

  return null;
};

export default function DesktopAuthScreen() {
  const { colors } = useThemeStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "approving" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState<string>("");
  const scannedRef = useRef(false);

  const canScan = status === "idle";

  useEffect(() => {
    if (Platform.OS === "web") return;
    getCameraPermissionsCompat()
      .then((res) => {
        setPermissionGranted(Boolean(res?.granted));
      })
      .catch(() => {
        setErrorText(t("desktopLoginCameraError"));
        setStatus("error");
      });
  }, [t]);

  const requestCamera = useCallback(async () => {
    if (Platform.OS === "web") return;
    setPermissionLoading(true);
    try {
      const res = await requestCameraPermissionsCompat();
      setPermissionGranted(Boolean(res?.granted));
    } catch {
      setErrorText(t("desktopLoginCameraError"));
      setStatus("error");
    } finally {
      setPermissionLoading(false);
    }
  }, [t]);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (!canScan || scannedRef.current) return;
      const parsed = parseQrPayload(data);
      if (!parsed) {
        scannedRef.current = true;
        setErrorText(t("desktopLoginInvalidQr"));
        setStatus("error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
        return;
      }

      try {
        scannedRef.current = true;
        setStatus("approving");
        await API.post("/api/auth/desktop/approve", parsed);
        setStatus("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      } catch (err: any) {
        setErrorText(err?.response?.data?.error || err?.message || t("desktopLoginFailed"));
        setStatus("error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
      }
    },
    [canScan, t]
  );

  const statusContent = useMemo(() => {
    if (status === "approving") {
      return (
        <View className="flex-row items-center">
          <ActivityIndicator color={colors.primary} />
          <Text className="ml-3 text-base" style={{ color: colors.foreground }}>
            {t("desktopLoginApproving")}
          </Text>
        </View>
      );
    }
    if (status === "success") {
      return (
        <View className="flex-row items-center">
          <CheckCircle2 size={22} color={colors.success || colors.primary} />
          <Text className="ml-3 text-base font-semibold" style={{ color: colors.foreground }}>
            {t("desktopLoginSuccess")}
          </Text>
        </View>
      );
    }
    if (status === "error") {
      return (
        <Text className="text-base" style={{ color: colors.destructive }}>
          {errorText || t("desktopLoginFailed")}
        </Text>
      );
    }
    return (
      <Text className="text-base" style={{ color: colors.mutedForeground }}>
        {t("desktopLoginWaiting")}
      </Text>
    );
  }, [colors, errorText, status, t]);

  const CameraView = (ExpoCamera as any).CameraView;
  const showCamera = permissionGranted && Platform.OS !== "web" && !!CameraView;
  const cameraHeight = Math.min(
    460,
    Math.max(280, Math.floor(Dimensions.get("window").height * 0.42))
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom + 20, 24),
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center">
            <QrCode size={22} color={colors.primary} />
            <Text className="ml-3 text-lg font-semibold" style={{ color: colors.foreground }}>
              {t("desktopLoginTitle")}
            </Text>
          </View>

          <Text className="mt-3 text-sm" style={{ color: colors.mutedForeground }}>
            {t("desktopLoginSubtitle")}
          </Text>

          <View className="mt-4">
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {t("desktopLoginStep1")}
            </Text>
            <Text className="mt-1 text-sm" style={{ color: colors.mutedForeground }}>
              {t("desktopLoginStep2")}
            </Text>
            <Text className="mt-1 text-sm" style={{ color: colors.mutedForeground }}>
              {t("desktopLoginStep3")}
            </Text>
          </View>
        </View>

        <View className="mt-6">
        {Platform.OS === "web" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.foreground }} className="text-base">
              {t("desktopLoginWebNotice")}
            </Text>
          </View>
        )}

        {Platform.OS !== "web" && !permissionGranted && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.foreground }} className="text-base">
              {t("desktopLoginCameraNeeded")}
            </Text>
            <TouchableOpacity
              onPress={requestCamera}
              disabled={permissionLoading}
              className="mt-4 py-3 rounded-full items-center"
              style={{ backgroundColor: colors.primary, opacity: permissionLoading ? 0.8 : 1 }}
            >
              <Text className="text-base font-semibold" style={{ color: colors.primaryForeground }}>
                {t("desktopLoginAllowCamera")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showCamera && (
          <View
            style={{
              borderRadius: 22,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.muted,
              height: cameraHeight,
            }}
          >
            <View style={{ flex: 1 }}>
              <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={canScan ? handleBarcodeScanned : undefined}
              />

              {/* Scan overlay */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: "74%",
                    aspectRatio: 1,
                    borderRadius: 22,
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.9)",
                    backgroundColor: "rgba(0,0,0,0.10)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    paddingHorizontal: 14,
                    paddingBottom: 14,
                  }}
                >
                  <View
                    style={{
                      alignSelf: "center",
                      backgroundColor: "rgba(0,0,0,0.55)",
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                      {canScan ? t("desktopLoginCameraHint") : t("desktopLoginApproving")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className="mt-4">{statusContent}</View>

        {(status === "error" || status === "success") && (
          <TouchableOpacity
            onPress={() => {
              scannedRef.current = false;
              setErrorText("");
              setStatus("idle");
            }}
            className="mt-4 py-3 rounded-full items-center flex-row justify-center"
            style={{ backgroundColor: colors.secondary }}
          >
            <RotateCcw size={18} color={colors.secondaryForeground} />
            <Text className="ml-2 text-base font-semibold" style={{ color: colors.secondaryForeground }}>
              {t("desktopLoginTryAgain")}
            </Text>
          </TouchableOpacity>
        )}
        </View>
      </ScrollView>
    </View>
  );
}
