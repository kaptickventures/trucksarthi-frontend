// app/auth/login.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image, SafeAreaView } from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Phone, Mail, Chrome } from "lucide-react-native";

const COLORS = {
  title: "#128C7E",
  subtitle: "#666666",
  buttonBg: "#F0F0F0",
  buttonBorder: "#D1D1D1",
  googleBorder: "#D1D1D1",
  link: "#25D366",
};

export default function LoginOptions() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white relative">

      {/* WHATSAPP GLOW */}
      <LinearGradient
        colors={[
          "rgba(37,211,102,0.40)",
          "rgba(18,140,126,0.25)",
          "rgba(18,140,126,0.10)",
          "transparent",
        ]}
        style={{
          width: 850,
          height: 850,
          borderRadius: 9999,
          position: "absolute",
          top: -200,
          alignSelf: "center",
        }}
      />

      {/* MAIN CONTENT */}
      <View className="flex-1 items-center justify-center px-8">

        {/* Logo */}
        <Image
          source={require("../../assets/images/TruckSarthi-Graphic.png")}
            style={{
    width: "70%",
    height: 90,
    marginBottom: 20,
  }}
  resizeMode="contain"
/>

        {/* TITLE */}
        <Text style={{ color: COLORS.title }} className="text-4xl font-extrabold">
          Welcome
        </Text>
        <Text style={{ color: COLORS.subtitle }} className="text-sm mt-1 mb-8 text-center">
          Manage your fleet effortlessly.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/auth/login-phone")}
          style={{ backgroundColor: COLORS.buttonBg, borderColor: COLORS.buttonBorder }}
          className="flex-row items-center justify-center w-full py-3 rounded-xl mb-4 border"
          activeOpacity={0.9}
        >
          <Phone size={20} color="#111B21" />
          <Text className="text-black text-base font-semibold ml-2">
            Continue with Phone
          </Text>
        </TouchableOpacity>

        {/* EMAIL LOGIN */}
        <TouchableOpacity
          onPress={() => router.push("/auth/login-email")}
          style={{ backgroundColor: COLORS.buttonBg, borderColor: COLORS.buttonBorder }}
          className="flex-row items-center justify-center w-full py-3 rounded-xl mb-4 border"
          activeOpacity={0.9}
        >
          <Mail size={20} color="#111B21" />
          <Text className="text-black text-base font-semibold ml-2">
            Continue with Email
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-2 w-full">
          <View className="flex-1 h-[1px] bg-gray-300" />
          <Text className="text-gray-500 px-3 text-xs">OR</Text>
          <View className="flex-1 h-[1px] bg-gray-300" />
        </View>

        {/* GOOGLE LOGIN (using Chrome icon from Lucide) */}
        {/* GOOGLE LOGIN (Coming Soon) */}
<TouchableOpacity
  onPress={() => {}}
  style={{ borderColor: COLORS.googleBorder, opacity: 0.6 }}
  className="flex-row items-center justify-center bg-white py-3 rounded-xl w-full border"
  activeOpacity={1}
>
  <Chrome size={20} color="#DB4437" />
  <Text className="text-gray-900 font-medium text-base ml-3">
    Continue with Google
  </Text>
</TouchableOpacity>

<Text
  style={{ color: COLORS.subtitle }}
  className="text-xs mt-1 text-center"
>
  Google sign-in coming soon
</Text>


        {/* SIGNUP */}
        <View className="mt-6 flex-row">
          <Text style={{ color: COLORS.subtitle }} className="text-sm">
            New here?
          </Text>
          <Link
            href="/auth/signup-email"
            style={{ color: COLORS.link }}
            className="font-semibold ml-2 text-sm"
          >
            Create Account
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
