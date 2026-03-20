import { Redirect, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "react-native-reanimated";
import { postLoginFlow } from "../hooks/useAuth";
import { useAuth } from "../context/AuthContext";
import { useThemeStore } from "../hooks/useThemeStore";

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { user, loading } = useAuth();
  const { colors } = useThemeStore();
  const isRouterReady = !!rootNavigationState?.key;

  useEffect(() => {
    if (!isRouterReady) return;

    if (Platform.OS === "web") return;
    if (!loading) {
      if (user) {
        postLoginFlow(router);
      } else {
        router.replace("/auth/login" as any);
      }
    }
  }, [user, loading, router, isRouterReady]);

  if (Platform.OS === "web") {
    return <Redirect href="/desktop-qr" />;
  }

  if (!isRouterReady || loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}
