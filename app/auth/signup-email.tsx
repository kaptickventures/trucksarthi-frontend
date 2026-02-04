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
import { THEME } from "../../theme";

export default function SignupEmail() {
  const router = useRouter();
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
      await registerUser(name.trim(), email.trim(), pw.trim());
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Signup Failed", e || "Could not create account. Please try again.");
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
                style={{ width: 170, height: 55, marginBottom: 24 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#111B21', letterSpacing: -0.5 }}>
                New Account
              </Text>
              <Text style={{ fontSize: 16, color: '#666666', marginTop: 8 }}>
                Join the largest fleet network in India
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <CustomInput
                label="FULL NAME"
                value={name}
                onChange={setName}
                placeholder="John Doe"
                icon={<User size={18} color="#999999" />}
              />

              <CustomInput
                label="EMAIL ADDRESS"
                value={email}
                onChange={setEmail}
                placeholder="name@company.com"
                autoCapitalize="none"
                icon={<Mail size={18} color="#999999" />}
              />

              <CustomInput
                label="CHOOSE PASSWORD"
                value={pw}
                onChange={setPw}
                secureTextEntry
                placeholder="••••••••"
                icon={<Lock size={18} color="#999999" />}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleSignup}
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
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Create My Account</Text>
                    <ArrowRight size={18} color={THEME.light.primary} strokeWidth={3} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              style={{ marginTop: 32, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#666666', fontSize: 14 }}>
                Already have an account? <Text style={{ color: THEME.light.primary, fontWeight: '700' }}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 40, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={{ color: '#999999', fontSize: 11, fontWeight: '700' }}>SECURE ENROLLMENT</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CustomInput = ({ label, value, onChange, placeholder, icon, autoCapitalize, secureTextEntry }: any) => (
  <View>
    <Text style={{ fontSize: 11, fontWeight: '800', color: '#999999', marginBottom: 8, marginLeft: 4 }}>{label}</Text>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8F9FA',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#E9ECEF',
      paddingHorizontal: 16
    }}>
      {icon}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
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
);
