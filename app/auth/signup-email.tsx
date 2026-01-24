// app/auth/signup-email.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
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

const COLORS = {
  title: "#128C7E",
  subtitle: "#666666",
  inputBg: "#F0F0F0",
  inputBorder: "#D1D1D1",
  buttonBg: "#111B21",
  buttonText: "#FFFFFF",
  link: "#25D366",
};

export default function SignupEmail() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!name || !email || !pw) {
      return Alert.alert("Error", "Please fill all fields.");
    }
    try {
      setLoading(true);
      await registerUser(name.trim(), email.trim(), pw.trim());
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Signup Failed", e.response?.data?.error || e.message || "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      {/* Back */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 999,
          padding: 8,
        }}
      >
        <ChevronLeft size={32} color="#111B21" />
      </TouchableOpacity>

      {/* Glow */}
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
          position: "absolute",
          top: -200,
          borderRadius: 9999,
          alignSelf: "center",
        }}
      />

      {/* Keyboard handler */}
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Image
            source={require("../../assets/images/TruckSarthi-Graphic.png")}
            style={{ width: "70%", height: 90, marginBottom: 20 }}
            resizeMode="contain"
          />

          {/* Title */}
          <Text className="text-4xl font-extrabold" style={{ color: COLORS.title }}>
            Create Account
          </Text>

          <Text className="mt-1 mb-8 text-center" style={{ color: COLORS.subtitle }}>
            Join the TruckSarthi network.
          </Text>

          {/* Form */}
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={COLORS.subtitle}
            value={name}
            onChangeText={setName}
            className="w-full border rounded-xl p-4 mb-4"
            style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.inputBorder }}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.subtitle}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            className="w-full border rounded-xl p-4 mb-4"
            style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.inputBorder }}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.subtitle}
            secureTextEntry
            value={pw}
            onChangeText={setPw}
            className="w-full border rounded-xl p-4 mb-6"
            style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.inputBorder }}
          />

          {/* Button */}
          <TouchableOpacity
            onPress={signup}
            disabled={loading}
            className="w-full py-3 rounded-xl items-center"
            style={{ backgroundColor: COLORS.buttonBg }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View className="mt-6 flex-row">
            <Text style={{ color: COLORS.subtitle }}>Already registered?</Text>
            <Link href="/auth/login-email" className="ml-2" style={{ color: COLORS.link }}>
              Login
            </Link>
          </View>

          <View className="mt-4">
            <Link href="/auth/login-phone" style={{ color: COLORS.link }}>
              Use Phone (OTP)
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
