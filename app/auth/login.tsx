import { useRouter } from "expo-router";
import { ChevronLeft, Smartphone, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
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
import { loginWithPhone, postLoginFlow, sendPhoneOtp } from "../../hooks/useAuth";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useAuth as useAuthContext } from "../../context/AuthContext";

const RESEND_SECONDS = 60;

export default function LoginPhone() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { refreshUser } = useAuthContext();
  const isDark = theme === "dark";
  const canGoBack = typeof router.canGoBack === "function" ? router.canGoBack() : false;

  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [code, setCode] = useState("");
  const userType: "fleet_owner" = "fleet_owner";
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!otpSent || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, secondsLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Formatting phone number
  const formatPhone = (text: string) => {
    const rawDigits = text.replace(/\D+/g, "");
    const numbers = rawDigits.startsWith("91") ? rawDigits.slice(2, 12) : rawDigits.slice(0, 10);
    setPhoneNumber(`+91${numbers}`);
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 13) {
      return Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
    }
    try {
      setLoading(true);
      await sendPhoneOtp(phoneNumber, userType);
      setOtpSent(true);
      setSecondsLeft(RESEND_SECONDS);
    } catch (error: any) {
      Alert.alert("Error", error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (code.length < 4) return Alert.alert("Error", "Please enter the complete OTP.");
    try {
      setLoading(true);
      await loginWithPhone(phoneNumber, code, userType);
      await refreshUser();
      await postLoginFlow(router);
    } catch (err: any) {
      Alert.alert("Verification Failed", err || "Invalid OTP. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}>
            {canGoBack ? (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8, marginLeft: -8 }}
              >
                <ChevronLeft size={28} color={colors.foreground} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ paddingHorizontal: 32, flex: 1, justifyContent: 'center' }}>
            <View style={{ marginBottom: 40 }}>
              <Image
                source={require("../../assets/Trucksarthi-Graphic.png")}
                style={{ width: 180, height: 60, marginBottom: 24, tintColor: isDark ? colors.foreground : undefined }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 }}>
                {otpSent ? "Verification" : "Mobile Number"}
              </Text>
              <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 8 }}>
                {otpSent
                  ? `We've sent a code to ${phoneNumber}`
                  : "Enter your phone number to continue"}
              </Text>
            </View>

            {!otpSent ? (
              <View style={{ gap: 20 }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>
                    Phone Number
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? colors.card : colors.input,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    paddingHorizontal: 16
                  }}>
                    <Smartphone size={20} color={colors.mutedForeground} />
                    <TextInput
                      value={phoneNumber}
                      onChangeText={formatPhone}
                      keyboardType="phone-pad"
                      maxLength={13}
                      placeholder="+91 XXXXX XXXXX"
                      placeholderTextColor={colors.mutedForeground}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        paddingHorizontal: 12,
                        fontSize: 20,
                        fontWeight: '800',
                        color: colors.foreground
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={handleSendOTP}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: 'center',
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Get OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 24 }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>
                    OTP Code
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? colors.card : colors.input,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    paddingHorizontal: 16
                  }}>
                    <Lock size={20} color={colors.mutedForeground} />
                    <TextInput
                      value={code}
                      onChangeText={setCode}
                      placeholder="Enter 6 digit code"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        paddingHorizontal: 12,
                        fontSize: 20,
                        fontWeight: '700',
                        letterSpacing: 3,
                        color: colors.foreground
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={handleVerifyOTP}
                  style={{
                    backgroundColor: colors.foreground,
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: 'center'
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={{ color: colors.background, fontSize: 16, fontWeight: '700' }}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendOTP}
                  disabled={loading || secondsLeft > 0}
                  style={{ alignSelf: "center", paddingVertical: 6 }}
                >
                  <Text
                    style={{
                      color: secondsLeft > 0 ? colors.mutedForeground : colors.primary,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {secondsLeft > 0 ? `Resend OTP in ${formatTimer(secondsLeft)}` : "Resend OTP"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setCode("");
                    setSecondsLeft(0);
                  }}
                  style={{ alignSelf: 'center' }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                    Change phone number?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ marginTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <View style={{ height: 1.5, flex: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>SECURE LOGIN</Text>
              <View style={{ height: 1.5, flex: 1, backgroundColor: colors.border }} />
            </View>

          </View>

          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              By continuing, you agree to our{"\n"}<Text style={{ fontWeight: 'bold' }}>Terms of Service</Text> and <Text style={{ fontWeight: 'bold' }}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

