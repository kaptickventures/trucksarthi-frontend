import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { ChevronLeft, Smartphone } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginWithPhone, postLoginFlow, sendOtp } from "../../hooks/useAuth";

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
  const [otpSent, setOtpSent] = useState(false);

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
      await sendOtp(phoneNumber);
      setOtpSent(true);
      Alert.alert("OTP Sent", `Sent to ${phoneNumber}`);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!code) return Alert.alert("Error", "Enter the OTP.");
    try {
      setLoading(true);
      // Here we hit POST /api/auth/verify-phone with phone and otp
      await loginWithPhone(phoneNumber, code);
      await postLoginFlow(router);
    } catch (err: any) {
      Alert.alert("Invalid OTP", err.response?.data?.error || "Failed to verify.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 24, left: 24, zIndex: 99, padding: 8 }}
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

          {!otpSent ? (
            <>
              <TextInput
                value={phoneNumber}
                onChangeText={formatPhone}
                keyboardType="phone-pad"
                className="w-full border rounded-xl p-4 mb-6"
                style={{ backgroundColor: COLORS.inputBg }}
              />

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
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="6 digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                className="w-full border rounded-xl p-4 mb-6 text-center tracking-widest"
                style={{ backgroundColor: COLORS.inputBg }}
              />

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
                  setOtpSent(false);
                  setCode("");
                }}
              >
                <Text className="mt-4" style={{ color: COLORS.link }}>
                  Change number
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
