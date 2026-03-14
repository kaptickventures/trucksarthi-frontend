import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, BackHandler, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { postLoginFlow } from "../../hooks/useAuth";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function AuthLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { colors } = useThemeStore();

  useEffect(() => {
    if (!loading && user) {
      postLoginFlow(router);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [loading, user]);

  if (loading || user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
