import { CheckCircle2, QrCode, RotateCcw, Unlink } from "lucide-react-native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ExpoCamera from "expo-camera";
import * as Haptics from "expo-haptics";
import "../../global.css";
import API from "../api/axiosInstance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

type ParsedQr = { sessionId: string; secret: string };
type LinkedDevice = { id: string; name: string; timestamp: string };
const LINKED_DEVICE_TTL_MS = 15 * 24 * 60 * 60 * 1000;
const LINKED_DEVICES_KEY = "desktopLinkedDevices";

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
  const [status, setStatus] = useState<"idle" | "approving" | "error" | "linked">("idle");
  const [errorText, setErrorText] = useState<string>("");
  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>([]);
  const scannedRef = useRef(false);

  const canScan = status === "idle";

  const persistLinkedDevices = useCallback(async (devices: LinkedDevice[]) => {
    await AsyncStorage.setItem(LINKED_DEVICES_KEY, JSON.stringify(devices));
  }, []);

  // Check linked devices on mount
  useEffect(() => {
    if (Platform.OS === "web") return;
    const checkLinkedDevice = async () => {
      try {
        const legacy = await AsyncStorage.getItem("desktopSessionLinked");
        const saved = await AsyncStorage.getItem(LINKED_DEVICES_KEY);
        const parsed = saved ? (JSON.parse(saved) as LinkedDevice[]) : [];
        const migrated = legacy
          ? [{ id: "legacy-desktop", name: "Desktop Web", timestamp: JSON.parse(legacy)?.timestamp || new Date().toISOString() }]
          : [];

        const merged = [...parsed, ...migrated];
        const now = Date.now();
        const valid = merged.filter((d) => {
          const linkedAt = new Date(d?.timestamp || 0).getTime();
          return Boolean(linkedAt) && now - linkedAt < LINKED_DEVICE_TTL_MS;
        });

        if (legacy) await AsyncStorage.removeItem("desktopSessionLinked");
        await persistLinkedDevices(valid);
        setLinkedDevices(valid);
        setStatus(valid.length ? "linked" : "idle");
      } catch {
        // ignore
      }
    };
    checkLinkedDevice();
  }, [persistLinkedDevices]);

  useEffect(() => {
    if (Platform.OS === "web" || linkedDevices.length > 0) return;
    getCameraPermissionsCompat()
      .then((res) => {
        setPermissionGranted(Boolean(res?.granted));
      })
      .catch(() => {
        setErrorText(t("desktopLoginCameraError"));
        setStatus("error");
      });
  }, [t, linkedDevices.length]);

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
        
        const newDevice: LinkedDevice = {
          id: parsed.sessionId,
          name: "Desktop Web",
          timestamp: new Date().toISOString(),
        };
        const deduped = [newDevice, ...linkedDevices.filter((d) => d.id !== newDevice.id)].slice(0, 5);
        await persistLinkedDevices(deduped);
        setLinkedDevices(deduped);
        setStatus("linked");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      } catch (err: any) {
        setErrorText(err?.response?.data?.error || err?.message || t("desktopLoginFailed"));
        setStatus("error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
      }
    },
    [canScan, t, linkedDevices, persistLinkedDevices]
  );

  const handleUnlinkDevice = useCallback(async (deviceId?: string) => {
    try {
      const next = deviceId ? linkedDevices.filter((d) => d.id !== deviceId) : [];
      await persistLinkedDevices(next);
      setLinkedDevices(next);
      setStatus(next.length ? "linked" : "idle");
      scannedRef.current = false;
      setErrorText("");
    } catch {
      // ignore
    }
  }, [linkedDevices, persistLinkedDevices]);

  const handleLogoutLinkedDevice = useCallback(async (deviceId?: string) => {
    await handleUnlinkDevice(deviceId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  }, [handleUnlinkDevice]);

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
    if (status === "linked") {
      return (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={20} color={colors.success || colors.primary} />
            <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
              Linked Devices
            </Text>
          </View>

          {linkedDevices.map((device) => (
            <View
              key={device.id}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                backgroundColor: colors.background,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>{device.name}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                  Since {new Date(device.timestamp).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleLogoutLinkedDevice(device.id)}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.destructiveSoft }}
              >
                <Text style={{ color: colors.destructive, fontWeight: "700", fontSize: 12 }}>Logout</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => handleLogoutLinkedDevice()}
            className="mt-2 py-3 rounded-full items-center flex-row justify-center"
            style={{ backgroundColor: colors.secondary }}
          >
            <Unlink size={18} color={colors.secondaryForeground} />
            <Text className="ml-2 text-base font-semibold" style={{ color: colors.secondaryForeground }}>
              Logout All Devices
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (status === "error") {
      return (
        <Text className="text-base text-center" style={{ color: colors.destructive }}>
          {errorText || t("desktopLoginFailed")}
        </Text>
      );
    }
    return (
      <Text className="text-base text-center" style={{ color: colors.mutedForeground }}>
        {t("desktopLoginWaiting")}
      </Text>
    );
  }, [colors, errorText, status, t, linkedDevices, handleLogoutLinkedDevice]);

  const CameraView = (ExpoCamera as any).CameraView;
  const showCamera = permissionGranted && Platform.OS !== "web" && !!CameraView && linkedDevices.length === 0;
  const cameraHeight = Math.min(
    460,
    Math.max(280, Math.floor(Dimensions.get("window").height * 0.42))
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom + 20, 24),
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <QrCode size={22} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "900" }}>
              {t("desktopLoginTitle")}
            </Text>
          </View>
          <Text style={{ color: colors.mutedForeground, marginTop: 8, textAlign: "center" }}>
            {t("desktopLoginSubtitle")}
          </Text>
        </View>

        {Platform.OS === "web" ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, textAlign: "center" }} className="text-base">
                {t("desktopLoginWebNotice")}
              </Text>
            </View>
          </View>
        ) : linkedDevices.length > 0 ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            {statusContent}
          </View>
        ) : !permissionGranted ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, textAlign: "center" }} className="text-base">
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
          </View>
        ) : (
          <>
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
                        borderColor: colors.overlayOnDark92,
                        backgroundColor: colors.overlay10,
                      }}
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={{ marginTop: 14 }}>{statusContent}</View>

            {status === "error" && (
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
          </>
        )}
      </ScrollView>
    </View>
  );
}
