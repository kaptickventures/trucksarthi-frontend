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
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { postLoginFlow } from "../../hooks/useAuth";

const COLORS = {
  title: "#128C7E",
  subtitle: "#666666",
  inputBg: "#F0F0F0",
  buttonBg: "#111B21",
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
      const res = await signInWithEmailAndPassword(auth, email.trim(), pw.trim());
      await postLoginFlow(router);
    } catch (e: any) {
      Alert.alert("Login Failed", e.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 24, left: 24, padding: 8 }}
      >
        <ChevronLeft size={32} color="#111B21" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Image
            source={require("../../assets/images/TruckSarthi-Graphic.png")}
            resizeMode="contain"
            style={{ width: "70%", height: 100, marginBottom: 20 }}
          />

          <Text className="text-4xl font-extrabold" style={{ color: COLORS.title }}>
            Login
          </Text>

          <Text className="mt-2 mb-8 text-center" style={{ color: COLORS.subtitle }}>
            Continue with your email
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            className="w-full border rounded-xl p-4 mb-4"
            style={{ backgroundColor: COLORS.inputBg }}
          />

          <TextInput
            value={pw}
            onChangeText={setPw}
            placeholder="Password"
            secureTextEntry
            className="w-full border rounded-xl p-4 mb-6"
            style={{ backgroundColor: COLORS.inputBg }}
          />

          <TouchableOpacity
            onPress={login}
            disabled={loading}
            className="w-full py-3 rounded-xl items-center"
            style={{ backgroundColor: COLORS.buttonBg }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "600" }}>Login</Text>
            )}
          </TouchableOpacity>

          <View className="mt-6 flex-row">
            <Text style={{ color: COLORS.subtitle }}>No account?</Text>
            <Link
              href="/auth/signup-email"
              style={{ marginLeft: 6, color: COLORS.link }}
            >
              Sign Up
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
