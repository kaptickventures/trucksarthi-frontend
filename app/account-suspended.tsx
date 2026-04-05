import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function AccountSuspendedScreen() {
  const handleBackToLogin = async () => {
    await AsyncStorage.removeItem("userToken");
    router.replace("/auth/login" as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff7ed" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fee2e2", padding: 16, borderRadius: 16, marginBottom: 16 }}>
          <AlertTriangle size={36} color="#dc2626" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827", textAlign: "center" }}>Account Suspended</Text>
        <Text style={{ marginTop: 12, fontSize: 14, color: "#4b5563", textAlign: "center", lineHeight: 22 }}>
          Your account access has been suspended by Trucksarthi admin.{"\n"}
          Please contact support to reactivate your account.
        </Text>
        <TouchableOpacity
          onPress={handleBackToLogin}
          style={{ marginTop: 24, backgroundColor: "#10b981", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700" }}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

