import { useRouter } from "expo-router";
import { ChevronLeft, Mail, Lock, ShieldCheck, ArrowRight, UserPlus } from "lucide-react-native";
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
import { loginWithEmail, postLoginFlow } from "../../hooks/useAuth";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useAuth as useAuthContext } from "../../context/AuthContext";

export default function LoginEmail() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { refreshUser } = useAuthContext();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !pw.trim()) {
      return Alert.alert("Missing Details", "Please enter both your email and password.");
    }
    try {
      setLoading(true);
      await loginWithEmail(email.toLowerCase().trim(), pw.trim());
      await refreshUser();
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Login Failed", e || "Invalid credentials. Please try again.");
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
                style={{ width: 170, height: 50, marginBottom: 24, tintColor: isDark ? colors.foreground : undefined }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 }}>
                Welcome Back
              </Text>
              <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 8 }}>
                Sign in with your email and password
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>EMAIL ADDRESS</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? colors.card : '#F8F9FA',
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: isDark ? colors.border : '#E9ECEF',
                  paddingHorizontal: 16
                }}>
                  <Mail size={18} color={colors.mutedForeground} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.foreground
                    }}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>PASSWORD</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? colors.card : '#F8F9FA',
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: isDark ? colors.border : '#E9ECEF',
                  paddingHorizontal: 16
                }}>
                  <Lock size={18} color={colors.mutedForeground} />
                  <TextInput
                    value={pw}
                    onChangeText={setPw}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.foreground
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleLogin}
                style={{
                  backgroundColor: colors.foreground,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  marginTop: 12,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <>
                    <Text style={{ color: colors.background, fontSize: 16, fontWeight: '700' }}>Login Account</Text>
                    <ArrowRight size={18} color={colors.primary} strokeWidth={3} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 32, alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => router.push("/auth/login-email-otp")}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                  Forgot password? Use Email OTP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/auth/signup-email")}
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                  Don&apos;t have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ padding: 40, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color={colors.primary} />
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>SECURE LOGIN</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
