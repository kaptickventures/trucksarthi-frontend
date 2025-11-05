// app/auth/signup-email.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, Link } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function SignupEmail() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      if (fullName) {
        await updateProfile(cred.user, { displayName: fullName });
      }
      // After signup -> go to Basic Details (we'll sync from that screen)
      router.replace("../basicDetails");
    } catch (e: any) {
      Alert.alert("Signup failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black px-6 justify-center">
      <Text className="text-3xl font-bold mb-8 text-black dark:text-white">Sign up (Email)</Text>

      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 text-black dark:text-white"
        placeholderTextColor="#999"
      />
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
        onPress={onSignup}
        disabled={loading}
        className={`rounded-xl py-4 items-center ${loading ? "bg-gray-400" : "bg-green-600"}`}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Create account</Text>}
      </TouchableOpacity>

      <View className="mt-6 flex-row">
        <Text className="text-gray-600 dark:text-gray-300">Already have an account?</Text>
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 ml-2">Login</Link>
      </View>

      <View className="mt-4">
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400">Use Phone (OTP)</Link>
      </View>
    </View>
  );
}
