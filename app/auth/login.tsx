import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth } from "../../firebaseConfig";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { useRouter } from "expo-router"; // ✅ navigation hook

export default function PhoneAuthScreen() {
  const router = useRouter(); // ✅ router for navigation
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<any>(null);

  // Step 1: Send verification code
  const sendVerification = async () => {
    try {
      if (!recaptchaVerifier.current) {
        alert("Recaptcha not ready. Please try again.");
        return;
      }
      setLoading(true);
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(id);
      alert("Verification code sent!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to send verification code: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm the code and navigate
  const confirmCode = async () => {
    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId!, code);
      await signInWithCredential(auth, credential);
      alert("✅ Login successful!");
      router.replace("/home"); // ✅ redirect to home.tsx
    } catch (err: any) {
      console.error(err);
      alert("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-black justify-center px-6"
    >
      {/* Firebase reCAPTCHA */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />

      {/* Header */}
      <View className="items-center mb-12">
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/3039/3039383.png",
          }}
          className="w-24 h-24 mb-4"
        />
        <Text className="text-3xl font-bold text-gray-800 dark:text-white">
          Welcome Back 👋
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-1">
          Sign in with your phone number
        </Text>
      </View>

      {/* Card */}
      <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
        {!verificationId ? (
          <>
            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              Phone Number
            </Text>
            <TextInput
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-black dark:text-white mb-5"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              disabled={loading}
              onPress={sendVerification}
              className={`${
                loading ? "bg-blue-400" : "bg-blue-600"
              } py-4 rounded-xl items-center`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Send Code
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              Enter OTP
            </Text>
            <TextInput
              placeholder="6-digit code"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-black dark:text-white mb-5 tracking-widest text-center"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              disabled={loading}
              onPress={confirmCode}
              className={`${
                loading ? "bg-green-400" : "bg-green-600"
              } py-4 rounded-xl items-center`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Verify & Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-5 items-center"
              onPress={() => setVerificationId(null)}
            >
              <Text className="text-blue-600 dark:text-blue-400 font-medium">
                Change Phone Number
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
