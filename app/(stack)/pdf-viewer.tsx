import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { View, TouchableOpacity, Text, Share } from "react-native";
import { WebView } from "react-native-webview";
import { useThemeStore } from "../../hooks/useThemeStore";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";

export default function PDFViewerScreen() {
    const { uri, title } = useLocalSearchParams<{ uri: string; title: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const { colors } = useThemeStore();

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
    }, [navigation, colors, uri, title]);

    const handleShare = async () => {
        if (uri) {
            await Sharing.shareAsync(uri);
        }
    };

    if (!uri) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <Text style={{ color: colors.foreground }}>No document found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <WebView
                source={{ uri }}
                style={{ flex: 1 }}
                originWhitelist={["*"]}
                scalesPageToFit={true}
            />
        </SafeAreaView>
    );
}
