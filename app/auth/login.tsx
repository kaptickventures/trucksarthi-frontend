// app/auth/login.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter, Link } from "expo-router";
import { AntDesign } from "@expo/vector-icons";

export default function LoginOptions() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white dark:bg-black justify-center items-center px-8">
      
      {/* Logo */}
      <Image
        source={require("../../assets/images/Trucksarthi-Logo.png")}
        className="w-28 h-28 mb-8"
        resizeMode="contain"
      />

      {/* Header */}
      <Text className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
        Welcome 👋
      </Text>

      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 mb-10">
        Login or create a new account to continue
      </Text>

      {/* Google Sign-in */}
      <TouchableOpacity
        onPress={() => router.push("/auth/login-google")}
        className="flex-row items-center justify-center border border-gray-300 dark:border-gray-700 py-4 rounded-xl w-full mb-5 bg-white dark:bg-neutral-900"
        activeOpacity={0.7}
      >
        <AntDesign name="google" size={22} color="#DB4437" />
        <Text className="text-black dark:text-white font-medium text-lg ml-3">
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Phone Login */}
      <TouchableOpacity
        onPress={() => router.push("/auth/login-phone")}
        className="bg-blue-600 py-4 rounded-xl w-full mb-4 items-center"
      >
        <Text className="text-white font-semibold text-lg">
          Continue with Phone
        </Text>
      </TouchableOpacity>

      {/* Email Login */}
      <TouchableOpacity
        onPress={() => router.push("/auth/login-email")}
        className="bg-green-600 py-4 rounded-xl w-full mb-2 items-center"
      >
        <Text className="text-white font-semibold text-lg">
          Continue with Email
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View className="mt-8 flex-row">
        <Text className="text-gray-600 dark:text-gray-300">
          Don’t have an account?
        </Text>

        <Link
          href="/auth/signup-email"
          className="text-blue-600 dark:text-blue-400 font-semibold ml-2"
        >
          Sign Up
        </Link>
      </View>
    </View>
  );
}
