// app/index.tsx
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Listen for Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ✅ User logged in → Go to Home
        router.replace("/(tabs)/home");
      } else {
        // 🚪 Not logged in → Go to Login
        router.replace("/auth/login");
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup on unmount
  }, []);

  // While checking user state
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null; 
}
