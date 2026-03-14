import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { postLoginFlow } from "../hooks/useAuth";
import { useAuth } from "../context/AuthContext";
import { useThemeStore } from "../hooks/useThemeStore";

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { colors } = useThemeStore();

  useEffect(() => {
    if (!loading) {
      if (user) {
        postLoginFlow(router);
      } else {
        router.replace("/auth/login" as any);
      }
    }
  }, [user, loading, router]);

  if (loading) {
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
