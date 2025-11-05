// app/auth/login.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter, Link } from "expo-router";

export default function LoginOptions() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white dark:bg-black justify-center items-center px-6">
      
      {/* Header / Logo */}
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/3039/3039383.png" }}
        className="w-24 h-24 mb-6"
      />

      <Text className="text-3xl font-bold text-black dark:text-white">
        Welcome 👋
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mt-1 mb-10">
        Choose how you want to continue
      </Text>

      {/* Login with Phone */}
      <TouchableOpacity
        onPress={() => router.push("/auth/login-phone")}
        className="bg-blue-600 py-4 rounded-xl w-full mb-4 items-center"
      >
        <Text className="text-white font-semibold text-lg">
          Continue with Phone
        </Text>
      </TouchableOpacity>

      {/* Login with Email */}
      <TouchableOpacity
        onPress={() => router.push("/auth/login-email")}
        className="bg-green-600 py-4 rounded-xl w-full mb-4 items-center"
      >
        <Text className="text-white font-semibold text-lg">
          Continue with Email
        </Text>
      </TouchableOpacity>

      {/* Signup Redirect */}
      <View className="mt-6 flex-row">
        <Text className="text-gray-600 dark:text-gray-300">
          Dont have an account?
        </Text>

        <Link href="/auth/signup-email" className="text-blue-600 dark:text-blue-400 ml-2">
          Sign Up
        </Link>
      </View>
    </View>
  );
}
