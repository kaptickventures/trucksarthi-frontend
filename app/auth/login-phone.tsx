import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth } from "../../firebaseConfig";
import { createRecaptchaVerifier } from "../../lib/RecaptchaVerifier";
import { useRouter, Link } from "expo-router";
import { postLoginFlow } from "../../hooks/useAuth";

export default function LoginPhone() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const sendVerification = async () => {
    try {
      setLoading(true);

      // Create invisible recaptcha verifier
      const verifier = createRecaptchaVerifier();

      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        verifier
      );

      setVerificationId(confirmation.verificationId);
      Alert.alert("OTP Sent", "Check your phone.");
    } catch (err: any) {
      console.log(err);
      Alert.alert("Failed to send OTP", err?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    try {
      if (!verificationId) return;

      setLoading(true);

      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);

      await postLoginFlow(router);
    } catch (err: any) {
      Alert.alert("Invalid Code", err?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white dark:bg-black justify-center px-6"
    >
      {/* Invisible recaptcha mount point */}
      <View id="recaptcha-container" style={{ opacity: 0, height: 0 }} />

      <Text className="text-3xl font-bold mb-8 text-black dark:text-white">
        Phone (OTP Login)
      </Text>

      {!verificationId ? (
        <>
          <TextInput
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-6 text-black dark:text-white"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            onPress={sendVerification}
            disabled={loading}
            className={`rounded-xl py-4 items-center ${
              loading ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Enter 6-digit OTP"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-6 text-black dark:text-white text-center tracking-widest"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            onPress={confirmCode}
            disabled={loading}
            className={`rounded-xl py-4 items-center ${
              loading ? "bg-gray-400" : "bg-green-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setVerificationId(null)} className="mt-4">
            <Text className="text-blue-600 dark:text-blue-400 text-center">
              Change phone number
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View className="mt-8">
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400">
          Use Email Instead
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
