import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, Text, Alert, Linking, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useThemeStore } from "../../hooks/useThemeStore";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

export default function PDFViewerScreen() {
    const { uri, title } = useLocalSearchParams<{ uri: string; title: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const { colors } = useThemeStore();
    const [loadFailed, setLoadFailed] = useState(false);
    const resolvedUri = (() => {
        const raw = String(uri || "");
        if (!raw) return "";

        const looksLikeAbsoluteUri =
            raw.startsWith("file://") ||
            raw.startsWith("http://") ||
            raw.startsWith("https://") ||
            raw.startsWith("/");

        const normalized = (() => {
            if (looksLikeAbsoluteUri) return raw;
            try {
                return decodeURIComponent(raw);
            } catch {
                return raw;
            }
        })();

        if (normalized.startsWith("file://") || normalized.startsWith("http://") || normalized.startsWith("https://")) {
            return normalized;
        }
        if (normalized.startsWith("/")) {
            return `file://${normalized}`;
        }
        return normalized;
    })();

    const handleShare = useCallback(async () => {
        if (resolvedUri) {
            await Sharing.shareAsync(resolvedUri);
        }
    }, [resolvedUri]);

    const openExternally = useCallback(async () => {
        if (!resolvedUri) return;
        try {
            let targetUri = resolvedUri;
            if (Platform.OS === "android" && resolvedUri.startsWith("file://")) {
                targetUri = await FileSystem.getContentUriAsync(resolvedUri);
            }
            await Linking.openURL(targetUri);
        } catch (error: any) {
            Alert.alert("Open failed", error?.message || "Could not open file in external app.");
        }
    }, [resolvedUri]);

    const isLocalPdfOnAndroid = useMemo(() => {
        if (Platform.OS !== "android") return false;
        const lower = String(resolvedUri || "").toLowerCase();
        return lower.startsWith("file://") && lower.endsWith(".pdf");
    }, [resolvedUri]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: title || "Document Viewer",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: {
                color: colors.foreground,
                fontWeight: "800",
                fontSize: 18,
            },
            headerTintColor: colors.foreground,
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ paddingHorizontal: 16 }}
                >
                    <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity
                    onPress={handleShare}
                    style={{ paddingHorizontal: 16 }}
                >
                    <Ionicons name="share-outline" size={24} color={colors.foreground} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, colors, resolvedUri, title, handleShare, router]);

    if (!resolvedUri) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <Text style={{ color: colors.foreground }}>No document found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
            {loadFailed && isLocalPdfOnAndroid ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
                        Android WebView cannot render this local PDF directly.
                    </Text>
                    <Text style={{ color: colors.mutedForeground, marginBottom: 20, textAlign: "center" }}>
                        Open it in your PDF app to preview.
                    </Text>
                    <TouchableOpacity
                        onPress={openExternally}
                        style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 }}
                    >
                        <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Open in PDF App</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <WebView
                    source={{ uri: resolvedUri }}
                    style={{ flex: 1 }}
                    originWhitelist={["*"]}
                    scalesPageToFit={true}
                    allowFileAccess
                    allowUniversalAccessFromFileURLs
                    allowingReadAccessToURL="file://"
                    onError={() => {
                        setLoadFailed(true);
                        console.log("Failed to open document URI:", resolvedUri);
                    }}
                />
            )}
        </SafeAreaView>
    );
}
