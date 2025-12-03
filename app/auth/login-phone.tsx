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
  RecaptchaVerifier,
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
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verificationIdRef = useRef<string | null>(null);
  const recaptchaVerifier = useRef<any>(null);

  const formatPhone = (text: string) => {
    let numbers = text.replace(/\D+/g, "");
    if (numbers.startsWith("91")) numbers = numbers.slice(2);
    numbers = numbers.slice(0, 10);
    setPhoneNumber("+91" + numbers);
  };

  const sendOTP = async () => {
    if (phoneNumber.length !== 13)
      return Alert.alert("Invalid number", "Enter a valid 10-digit number");

    try {
      setLoading(true);

      if (!recaptchaVerifier.current) {
        // RecaptchaVerifier signature expects the Auth instance first in this environment
        recaptchaVerifier.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }

      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );

      verificationIdRef.current = verificationId;
      Alert.alert("OTP sent", `To: ${phoneNumber}`);

    } catch (err: any) {
      Alert.alert("Error sending OTP", err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!verificationIdRef.current)
      return Alert.alert("Error", "Please request OTP first");

    try {
      setLoading(true);

      const credential = PhoneAuthProvider.credential(
        verificationIdRef.current,
        code
      );

      await signInWithCredential(auth, credential);
      await postLoginFlow(router);

    } catch (err: any) {
      Alert.alert("Invalid OTP", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 24, left: 24, padding: 8, zIndex: 10 }}
      >
        <ChevronLeft size={32} color="#111B21" />
      </TouchableOpacity>

      <LinearGradient
        colors={["rgba(37,211,102,0.25)", "transparent"]}
        style={{
          width: 800,
          height: 800,
          position: "absolute",
          top: -200,
          borderRadius: 999,
        }}
      />

      {/* REQUIRED for Firebase Recaptcha Web SDK */}
      <View id="recaptcha-container" style={{ height: 0, opacity: 0 }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 30,
          }}
        >
          <Image
            source={require("../../assets/images/TruckSarthi-Graphic.png")}
            style={{ width: "70%", height: 100, marginBottom: 20 }}
            resizeMode="contain"
          />

          <Text className="text-4xl font-extrabold" style={{ color: COLORS.title }}>
            Phone Login
          </Text>

          <Text
            className="my-3 text-center"
            style={{ color: COLORS.subtitle, fontSize: 14 }}
          >
            Enter your phone number to continue
          </Text>

          {!verificationIdRef.current ? (
            <>
              <TextInput
                value={phoneNumber}
                onChangeText={formatPhone}
                keyboardType="phone-pad"
                className="w-full border rounded-xl p-4 mb-6"
                style={{ backgroundColor: COLORS.inputBg }}
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
              <Text
                className="mb-2 text-center"
                style={{ color: COLORS.subtitle }}
              >
                OTP sent to {phoneNumber}
              </Text>

              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                maxLength={6}
                className="w-full border rounded-xl p-4 mb-6 text-center tracking-widest"
                style={{ backgroundColor: COLORS.inputBg }}
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
                  verificationIdRef.current = null;
                  setCode("");
                }}
              >
                <Text
                  style={{ marginTop: 14, color: COLORS.link, fontWeight: "600" }}
                >
                  Change Number
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
