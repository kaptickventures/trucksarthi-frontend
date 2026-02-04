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
import { THEME } from "../../theme";

export default function LoginEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !pw.trim()) {
      return Alert.alert("Missing Details", "Please enter both your email and password.");
    }
    try {
      setLoading(true);
      await loginWithEmail(email.trim(), pw.trim());
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Login Failed", e || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
              <ChevronLeft size={28} color="#111B21" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 32, flex: 1, justifyContent: 'center' }}>
            <View style={{ marginBottom: 40 }}>
              <Image
                source={require("../../assets/images/TruckSarthi-Graphic.png")}
                style={{ width: 170, height: 50, marginBottom: 24 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#111B21', letterSpacing: -0.5 }}>
                Welcome Back
              </Text>
              <Text style={{ fontSize: 16, color: '#666666', marginTop: 8 }}>
                Sign in with your email and password
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#999999', marginBottom: 8, marginLeft: 4 }}>EMAIL ADDRESS</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F8F9FA',
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#E9ECEF',
                  paddingHorizontal: 16
                }}>
                  <Mail size={18} color="#999999" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@company.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111B21'
                    }}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#999999', marginBottom: 8, marginLeft: 4 }}>PASSWORD</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F8F9FA',
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#E9ECEF',
                  paddingHorizontal: 16
                }}>
                  <Lock size={18} color="#999999" />
                  <TextInput
                    value={pw}
                    onChangeText={setPw}
                    secureTextEntry
                    placeholder="••••••••"
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111B21'
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleLogin}
                style={{
                  backgroundColor: '#111B21',
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
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Login Account</Text>
                    <ArrowRight size={18} color={THEME.light.primary} strokeWidth={3} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 32, alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => router.push("/auth/login-email-otp")}>
                <Text style={{ color: THEME.light.primary, fontWeight: '700', fontSize: 14 }}>
                  Forgot password? Use Email OTP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/auth/signup-email")}
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ color: '#666666', fontSize: 14 }}>
                  Don't have an account? <Text style={{ color: THEME.light.primary, fontWeight: '700' }}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ padding: 40, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={{ color: '#999999', fontSize: 11, fontWeight: '700' }}>SECURE LOGIN</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
