import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { ChevronLeft, Smartphone, ShieldCheck, Lock } from "lucide-react-native";
import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width } = Dimensions.get("window");

export default function LoginPhone() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [code, setCode] = useState("");
  const [userType, setUserType] = useState<"fleet_owner" | "driver">("fleet_owner");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Formatting phone number
  const formatPhone = (text: string) => {
    let numbers = text.replace(/\D+/g, "");
    if (numbers.startsWith("91")) numbers = numbers.slice(2);
    numbers = numbers.slice(0, 10);
    setPhoneNumber("+91" + numbers);
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 13) {
      return Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
    }
    try {
      setLoading(true);
      await sendPhoneOtp(phoneNumber, userType);
      setOtpSent(true);
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <ChevronLeft size={28} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 32, flex: 1, justifyContent: 'center' }}>
            <View style={{ marginBottom: 40 }}>
              <Image
                source={require("../../assets/images/TruckSarthi-Graphic.png")}
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
                {/* Role Switcher */}
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: isDark ? colors.card : '#F0F2F5',
                  borderRadius: 16,
                  padding: 4,
                  marginBottom: 8
                }}>
                  <TouchableOpacity
                    onPress={() => setUserType('fleet_owner')}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderRadius: 12,
                      backgroundColor: userType === 'fleet_owner' ? (isDark ? colors.foreground : 'white') : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: userType === 'fleet_owner' ? 0.1 : 0,
                      shadowRadius: 4,
                      elevation: userType === 'fleet_owner' ? 2 : 0
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: userType === 'fleet_owner' ? (isDark ? colors.background : colors.foreground) : colors.mutedForeground
                    }}>Fleet Owner</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setUserType('driver')}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderRadius: 12,
                      backgroundColor: userType === 'driver' ? (isDark ? colors.foreground : 'white') : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: userType === 'driver' ? 0.1 : 0,
                      shadowRadius: 4,
                      elevation: userType === 'driver' ? 2 : 0
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: userType === 'driver' ? (isDark ? colors.background : colors.foreground) : colors.mutedForeground
                    }}>Driver</Text>
                  </TouchableOpacity>
                </View>

                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>
                    Phone Number
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? colors.card : '#F8F9FA',
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isDark ? colors.border : '#E9ECEF',
                    paddingHorizontal: 16
                  }}>
                    <Smartphone size={20} color={colors.mutedForeground} />
                    <TextInput
                      value={phoneNumber}
                      onChangeText={formatPhone}
                      keyboardType="phone-pad"
                      placeholder="+91 XXXXX XXXXX"
                      placeholderTextColor={colors.mutedForeground}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        paddingHorizontal: 12,
                        fontSize: 18,
                        fontWeight: '600',
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
                    backgroundColor: isDark ? colors.card : '#F8F9FA',
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isDark ? colors.border : '#E9ECEF',
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
                        fontSize: 24,
                        fontWeight: '700',
                        letterSpacing: 4,
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
                  onPress={() => {
                    setOtpSent(false);
                    setCode("");
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
              <View style={{ height: 1.5, flex: 1, backgroundColor: isDark ? colors.border : '#E9ECEF' }} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>SECURE LOGIN</Text>
              <View style={{ height: 1.5, flex: 1, backgroundColor: isDark ? colors.border : '#E9ECEF' }} />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/auth/login-email")}
              style={{ marginTop: 24, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                Try <Text style={{ color: colors.primary, fontWeight: '700' }}>Email Login</Text> instead
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              By continuing, you agree to our <Text style={{ fontWeight: 'bold' }}>Terms of Service</Text> and <Text style={{ fontWeight: 'bold' }}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
