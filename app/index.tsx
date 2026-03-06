import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { postLoginFlow } from "../hooks/useAuth";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        postLoginFlow(router);
      } else {
        router.replace("/auth/login");
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
          backgroundColor: "white",
        }}
      >
        <ActivityIndicator size="large" color="#128C7E" />
      </View>
    );
  }

  return null;
}
