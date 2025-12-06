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
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Smartphone } from "lucide-react-native";

import {
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { postLoginFlow } from "../../hooks/useAuth";

const COLORS = {
  title: "#128C7E",
  subtitle: "#666666",
  inputBg: "#F0F0F0",
  buttonBg: "#111B21",
  buttonText: "#FFFFFF",
  link: "#25D366",
};

export default function LoginPhone() {
  const router = useRouter();
  const confirmationRef = useRef<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPhone = (text: string) => {
    let numbers = text.replace(/\D+/g, "");
    if (numbers.startsWith("91")) numbers = numbers.slice(2);
    numbers = numbers.slice(0, 10);
    setPhoneNumber("+91" + numbers);
  };

  const sendOTP = async () => {
    if (phoneNumber.length !== 13) {
      return Alert.alert("Invalid Number", "Enter a valid 10-digit number.");
    }

    try {
      setLoading(true);

      const provider = new PhoneAuthProvider(auth);
      const sessionInfo = await provider.verifyPhoneNumber(phoneNumber);

      confirmationRef.current = sessionInfo;
      Alert.alert("OTP Sent", `Sent to ${phoneNumber}`);
    } catch (error: any) {
      console.log("OTP ERR:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to send OTP. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!confirmationRef.current) {
      return Alert.alert("Error", "Please request OTP again.");
    }

    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(
        confirmationRef.current,
        code
      );

      await signInWithCredential(auth, credential);
      await postLoginFlow(router);
    } catch (err: any) {
      console.log("VERIFY ERR:", err);
      Alert.alert("Invalid OTP", "Incorrect or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 24, left: 24, zIndex: 99, padding: 8 }}
      >
        <ChevronLeft size={32} color="#111B21" />
      </TouchableOpacity>

      {/* Glow Background */}
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
          top: -200,
          borderRadius: 9999,
          position: "absolute",
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
            Enter your mobile number
          </Text>

          {!confirmationRef.current ? (
            <>
              {/* Phone Input */}
              <TextInput
                value={phoneNumber}
                onChangeText={formatPhone}
                keyboardType="phone-pad"
                className="w-full border rounded-xl p-4 mb-6"
                style={{ backgroundColor: COLORS.inputBg }}
              />

              {/* Send OTP Button */}
              <TouchableOpacity
                disabled={loading}
                onPress={sendOTP}
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
              {/* OTP Input */}
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="6 digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                className="w-full border rounded-xl p-4 mb-6 text-center tracking-widest"
                style={{ backgroundColor: COLORS.inputBg }}
              />

              {/* Verify Button */}
              <TouchableOpacity
                disabled={loading}
                onPress={verifyOTP}
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
                  Change number
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Email login link */}
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
