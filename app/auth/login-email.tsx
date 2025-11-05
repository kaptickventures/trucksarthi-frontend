// app/auth/login-email.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, Link } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { postLoginFlow } from "../../hooks/useAuth"

export default function LoginEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black px-6 justify-center">
      <Text className="text-3xl font-bold mb-8 text-black dark:text-white">Login (Email)</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 text-black dark:text-white"
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={pw}
        onChangeText={setPw}
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-6 text-black dark:text-white"
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        onPress={onLogin}
        disabled={loading}
        className={`rounded-xl py-4 items-center ${loading ? "bg-gray-400" : "bg-blue-600"}`}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Login</Text>}
      </TouchableOpacity>

      <View className="mt-6 flex-row">
        <Text className="text-gray-600 dark:text-gray-300">No account?</Text>
        <Link href="/" className="text-blue-600 dark:text-blue-400 ml-2">Sign up</Link>
      </View>

      <View className="mt-4">
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400">Use Phone (OTP)</Link>
      </View>
    </View>
  );
}
