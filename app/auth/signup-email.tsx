import { useRouter } from "expo-router";
import { ChevronLeft, User, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react-native";
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
import { postLoginFlow, registerUser } from "../../hooks/useAuth";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useAuth as useAuthContext } from "../../context/AuthContext";

export default function SignupEmail() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { refreshUser } = useAuthContext();
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !pw.trim()) {
      return Alert.alert("Required Fields", "Please enter your name, email, and a secure password.");
    }
    if (pw.length < 6) {
      return Alert.alert("Password Weak", "Password must be at least 6 characters long.");
    }

    try {
      setLoading(true);
      await registerUser(name.trim(), email.toLowerCase().trim(), pw.trim());
      await refreshUser();
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Signup Failed", e || "Could not create account. Please try again.");
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
                style={{ width: 170, height: 55, marginBottom: 24, tintColor: isDark ? colors.foreground : undefined }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 }}>
                New Account
              </Text>
              <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 8 }}>
                Join the largest fleet network in India
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <CustomInput
                label="FULL NAME"
                value={name}
                onChange={setName}
                placeholder="John Doe"
                icon={<User size={18} color={colors.mutedForeground} />}
                colors={colors}
                isDark={isDark}
              />

              <CustomInput
                label="EMAIL ADDRESS"
                value={email}
                onChange={setEmail}
                placeholder="name@company.com"
                autoCapitalize="none"
                keyboardType="email-address"
                icon={<Mail size={18} color={colors.mutedForeground} />}
                colors={colors}
                isDark={isDark}
              />

              <CustomInput
                label="CHOOSE PASSWORD"
                value={pw}
                onChange={setPw}
                secureTextEntry
                placeholder="••••••••"
                icon={<Lock size={18} color={colors.mutedForeground} />}
                colors={colors}
                isDark={isDark}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleSignup}
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
                    <Text style={{ color: colors.background, fontSize: 16, fontWeight: '700' }}>Create My Account</Text>
                    <ArrowRight size={18} color={colors.primary} strokeWidth={3} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              style={{ marginTop: 32, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 40, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color={colors.primary} />
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>SECURE ENROLLMENT</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CustomInput = ({ label, value, onChange, placeholder, icon, autoCapitalize, secureTextEntry, keyboardType, colors, isDark }: any) => (
  <View>
    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>{label}</Text>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.card : '#F8F9FA',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : '#E9ECEF',
      paddingHorizontal: 16
    }}>
      {icon}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
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
);
