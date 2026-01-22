// app/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { getCurrentUser } from "../hooks/useAuth";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          // Verify token by fetching user
          const user = await getCurrentUser();
          if (user) {
            router.replace("/(tabs)/home");
          } else {
            // Token might be invalid/expired
            await AsyncStorage.removeItem("userToken");
            router.replace("/auth/login");
          }
        } else {
          router.replace("/auth/login");
        }
      } catch (e) {
        console.error("Auth check error:", e);
        router.replace("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
