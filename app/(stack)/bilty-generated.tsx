import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import * as Sharing from "expo-sharing";

import { useThemeStore } from "../../hooks/useThemeStore";

export default function BiltyGeneratedScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { biltyId, biltyNumber, tripId, uri } = useLocalSearchParams<{
    biltyId?: string;
    biltyNumber?: string;
    tripId?: string;
    uri?: string;
  }>();

  const pdfUri = String(uri || "");

  const openPreview = () => {
    if (!pdfUri) {
      Alert.alert("Preview unavailable", "Bilty was generated but preview file is not available.");
      return;
    }
    router.push({ pathname: "/(stack)/pdf-viewer", params: { uri: pdfUri, title: "LR Preview" } } as any);
  };

  const sharePdf = async () => {
    if (!pdfUri) {
      Alert.alert("Download unavailable", "No generated PDF found to share.");
      return;
    }
    try {
      await Sharing.shareAsync(pdfUri);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to share generated PDF.");
    }
  };

  const goToCreateAnother = () => {
    router.replace({ pathname: "/(stack)/bilty-wizard", params: { tripId: String(tripId || "") } } as any);
  };

  const goToTrip = () => {
    if (!tripId) {
      router.replace("/(tabs)" as any);
      return;
    }
    router.replace({ pathname: "/(stack)/trip-detail", params: { tripId: String(tripId) } } as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? colors.background : "#F4F6F9", padding: 16, justifyContent: "center" }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.card : "#FFFFFF",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text style={{ color: "#111111", fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 6 }}>
          Bilty Saved
        </Text>
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginBottom: 8 }}>
          Your bilty was generated successfully.
        </Text>
        <Text style={{ color: "#111111", fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: 16 }}>
          {String(biltyNumber || "-")}
        </Text>

        <TouchableOpacity
          onPress={openPreview}
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 10 }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>View Bilty</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={sharePdf}
          style={{
            backgroundColor: isDark ? colors.input : "#FFFFFF",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "800" }}>Download / Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToCreateAnother}
          style={{
            backgroundColor: colors.successSoft,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "800" }}>Create Another</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToTrip}
          style={{
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "700" }}>Back to Trip</Text>
        </TouchableOpacity>

        {biltyId ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 12, textAlign: "center" }}>
            ID: {String(biltyId)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
