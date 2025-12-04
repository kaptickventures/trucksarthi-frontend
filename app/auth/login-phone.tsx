// app/auth/login-phone.tsx
import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";

import auth from "@react-native-firebase/auth";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Smartphone } from "lucide-react-native";

import { postLoginFlow } from "../../hooks/useAuth";

const COLORS = {
  title: "#128C7E",
  subtitle: "#666666",
  inputBg: "#F0F0F0",
  inputBorder: "#D1D1D1",
  buttonBg: "#111B21",
  buttonText: "#FFFFFF",
  link: "#25D366",
};

export default function LoginPhone() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("+91");
  const confirmationRef = useRef<any>(null); // <-- FIXED: useRef
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPhone = (text: string) => {
    let numbers = text.replace(/\D+/g, "");
    if (numbers.startsWith("91")) numbers = numbers.slice(2);
    numbers = numbers.slice(0, 10);
    setPhoneNumber("+91" + numbers);
  };

  const sendOTP = async () => {
    try {
      if (phoneNumber.length !== 13) {
        return Alert.alert("Invalid number", "Enter a valid 10-digit number.");
      }
      setLoading(true);

      const confirmResult = await auth().signInWithPhoneNumber(phoneNumber);
      confirmationRef.current = confirmResult; // <-- FIXED

      Alert.alert("OTP Sent");
    } catch (e: any) {
      Alert.alert("Failed to send OTP", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      if (!confirmationRef.current) return alert("No OTP request found!");
      setLoading(true);

      const result = await confirmationRef.current.confirm(code); // <-- FIXED
      console.log("Signed in user:", result.user);

      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Invalid OTP", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 24, left: 24, zIndex: 999, padding: 8 }}
      >
        <ChevronLeft size={32} color="#111B21" />
      </TouchableOpacity>

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
          position: "absolute",
          top: -200,
          borderRadius: 9999,
          alignSelf: "center",
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../../assets/images/TruckSarthi-Graphic.png")}
            style={{ width: "70%", height: 90, marginBottom: 20 }}
            resizeMode="contain"
          />

          <Text className="text-4xl font-extrabold" style={{ color: COLORS.title }}>
            Phone Login
          </Text>

          <Text className="mt-1 mb-8 text-center" style={{ color: COLORS.subtitle }}>
            Use your mobile number to continue.
          </Text>

          {!confirmationRef.current ? (
            <>
              <TextInput
                placeholder="+91XXXXXXXXXX"
                placeholderTextColor={COLORS.subtitle}
                value={phoneNumber}
                onChangeText={formatPhone}
                keyboardType="phone-pad"
                className="w-full border rounded-xl p-4 mb-6"
                style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.inputBorder }}
              />

              <TouchableOpacity
                onPress={sendOTP}
                disabled={loading}
                className="w-full py-3 rounded-xl items-center"
                style={{ backgroundColor: COLORS.buttonBg }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <Smartphone size={20} color="white" />
                    <Text className="ml-2 text-white font-semibold">Send OTP</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={COLORS.subtitle}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                className="w-full border rounded-xl p-4 mb-6 text-center tracking-widest"
                style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.inputBorder }}
              />

              <TouchableOpacity
                onPress={verifyOTP}
                disabled={loading}
                className="w-full py-3 rounded-xl items-center"
                style={{ backgroundColor: COLORS.buttonBg }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  confirmationRef.current = null;
                  setCode("");
                }}
              >
                <Text className="mt-4" style={{ color: COLORS.link }}>
                  Change phone number
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View className="mt-8">
            <Link href="/auth/login-email" style={{ color: COLORS.link }}>
              Use Email Instead
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
