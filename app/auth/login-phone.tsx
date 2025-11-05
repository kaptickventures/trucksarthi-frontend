// app/auth/login-phone.tsx
import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { useRouter, Link } from "expo-router";
import { auth } from "../../firebaseConfig";
import { postLoginFlow } from "../../hooks/useAuth"

export default function LoginPhone() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<any>(null);

  const sendVerification = async () => {
    try {
      if (!recaptchaVerifier.current) {
        Alert.alert("reCAPTCHA not ready");
        return;
      }
      setLoading(true);
      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier.current);
      setVerificationId(id);
      Alert.alert("OTP sent");
    } catch (e: any) {
      Alert.alert("Failed to send code", e?.message ?? "Try again.");
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
    } catch (e: any) {
      Alert.alert("Invalid code", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-white dark:bg-black justify-center px-6">
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={auth.app.options} />

      <Text className="text-3xl font-bold mb-8 text-black dark:text-white">Phone (OTP)</Text>

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
          <TouchableOpacity onPress={sendVerification} disabled={loading} className={`rounded-xl py-4 items-center ${loading ? "bg-gray-400" : "bg-blue-600"}`}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Send Code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="6-digit OTP"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-6 text-black dark:text-white tracking-widest text-center"
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={confirmCode} disabled={loading} className={`rounded-xl py-4 items-center ${loading ? "bg-gray-400" : "bg-green-600"}`}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Verify & Continue</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVerificationId(null)} className="mt-4">
            <Text className="text-blue-600 dark:text-blue-400 text-center">Change phone number</Text>
          </TouchableOpacity>
        </>
      )}

      <View className="mt-8">
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400">Use Email instead</Link>
      </View>
    </KeyboardAvoidingView>
  );
}
