// app/auth/login-email.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { postLoginFlow } from "../../hooks/useAuth";

const COLORS = {
  title: "#128C7E",
  subtitle: "#666666",
  inputBg: "#F0F0F0",
  inputBorder: "#D1D1D1",
  buttonBg: "#111B21",
  buttonText: "#FFFFFF",
  link: "#25D366",
};

export default function LoginEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Login Failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">

      {/* BACK BUTTON */}
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

      {/* GLOW */}
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

      {/* KEYBOARD HANDLING */}
      <KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : undefined}
  style={{ flex: 1 }}
>
  <ScrollView
    contentContainerStyle={{
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",  // <-- fixes left alignment
      paddingHorizontal: 32,
    }}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >

          {/* LOGO */}
          <Image
            source={require("../../assets/images/TruckSarthi-Graphic.png")}
            style={{ width: "70%", height: 90, marginBottom: 20 }}
            resizeMode="contain"
          />

          {/* TITLE */}
          <Text className="text-4xl font-extrabold" style={{ color: COLORS.title }}>
            Login
          </Text>
          <Text className="mt-1 mb-8 text-center" style={{ color: COLORS.subtitle }}>
            Continue with your email.
          </Text>

          {/* INPUTS */}
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.subtitle}
            value={email}
            onChangeText={setEmail}
            style={{
              backgroundColor: COLORS.inputBg,
              borderColor: COLORS.inputBorder,
            }}
            className="w-full border rounded-xl p-4 mb-4"
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            placeholderTextColor={COLORS.subtitle}
            value={pw}
            onChangeText={setPw}
            style={{
              backgroundColor: COLORS.inputBg,
              borderColor: COLORS.inputBorder,
            }}
            className="w-full border rounded-xl p-4 mb-6"
          />

          {/* BUTTON */}
          <TouchableOpacity
            onPress={login}
            disabled={loading}
            style={{ backgroundColor: COLORS.buttonBg }}
            className="w-full py-3 rounded-xl items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Login</Text>
            )}
          </TouchableOpacity>

          {/* FOOTER */}
          <View className="mt-6 flex-row justify-center">
            <Text style={{ color: COLORS.subtitle }}>No account?</Text>
            <Link href="/auth/signup-email" style={{ color: COLORS.link }} className="ml-2">
              Sign Up
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
