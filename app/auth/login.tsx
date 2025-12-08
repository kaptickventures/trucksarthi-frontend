// app/auth/login.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Chrome, Mail, Phone } from "lucide-react-native";
import { useEffect } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { postLoginFlow } from "../../hooks/useAuth";

WebBrowser.maybeCompleteAuthSession();

// 🔑 Google OAuth IDs
const ANDROID_CLIENT_ID =
  "685782590797-fkfs02vnj1cvep6mjkbaulb0dd3o4c67.apps.googleusercontent.com";
const WEB_CLIENT_ID =
  "685782590797-k4us38g7vsm0shekavkkpoe6gd2gqj6p.apps.googleusercontent.com";

const redirectUri = "trucksarthifrontend://";


console.log("🔗 USING REDIRECT", redirectUri);


const COLORS = {
  title: "#128C7E",
  subtitle: "#666666",
  buttonBg: "#F0F0F0",
  buttonBorder: "#D1D1D1",
  googleBorder: "#D1D1D1",
  link: "#25D366",
};

export default function LoginOptions() {
  const router = useRouter();
  const isAndroid = Platform.OS === "android";

  console.log("🔗 Google Redirect URI:", redirectUri);

  // Google Login Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    redirectUri,
  });

  // Listen for Auth Response
  useEffect(() => {
    const handleGoogleAuth = async () => {
      if (response?.type !== "success") return;

      const { id_token } = response.params;
      if (!id_token) return;

      try {
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
        await postLoginFlow(router);
      } catch (err: any) {
        console.log("Google Sign-In Error:", err);
        Alert.alert("Google Login Failed", err.message);
      }
    };

    handleGoogleAuth();
  }, [response]);

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      {/* Background Glow */}
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
          borderRadius: 9999,
          position: "absolute",
          top: -200,
          alignSelf: "center",
        }}
      />

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <Image
          source={require("../../assets/images/TruckSarthi-Graphic.png")}
          style={{ width: "70%", height: 90, marginBottom: 20 }}
          resizeMode="contain"
        />

        <Text style={{ color: COLORS.title }} className="text-4xl font-extrabold">
          Welcome
        </Text>
        <Text
          style={{ color: COLORS.subtitle }}
          className="text-sm mt-1 mb-8 text-center"
        >
          Manage your fleet effortlessly.
        </Text>

        {/* Phone Login */}
        <TouchableOpacity
          onPress={() => router.push("/auth/login-phone")}
          className="flex-row items-center justify-center w-full py-3 rounded-xl mb-4 border"
          style={{
            backgroundColor: COLORS.buttonBg,
            borderColor: COLORS.buttonBorder,
          }}
        >
          <Phone size={20} color="#111B21" />
          <Text className="ml-2 font-semibold">Continue with Phone</Text>
        </TouchableOpacity>

        {/* Email Login */}
        <TouchableOpacity
          onPress={() => router.push("/auth/login-email")}
          className="flex-row items-center justify-center w-full py-3 rounded-xl mb-4 border"
          style={{
            backgroundColor: COLORS.buttonBg,
            borderColor: COLORS.buttonBorder,
          }}
        >
          <Mail size={20} color="#111B21" />
          <Text className="ml-2 font-semibold">Continue with Email</Text>
        </TouchableOpacity>

        {/* OR Divider */}
        <View className="flex-row items-center my-2 w-full">
          <View className="flex-1 h-[1px] bg-gray-300" />
          <Text className="text-gray-500 px-3 text-xs">OR</Text>
          <View className="flex-1 h-[1px] bg-gray-300" />
        </View>

        {/* Google Login */}
        <TouchableOpacity
          disabled={!isAndroid}
          onPress={() => {
            if (isAndroid && request) promptAsync();
          }}
          className="flex-row items-center justify-center bg-white py-3 rounded-xl w-full border"
          style={{
            borderColor: COLORS.googleBorder,
            opacity: isAndroid ? 1 : 0.4,
          }}
        >
          <Chrome size={20} color="#DB4437" />
          <Text className="ml-3 font-medium">Continue with Google</Text>
        </TouchableOpacity>

        {!isAndroid && (
          <Text className="text-xs mt-2 text-gray-600">
            Google Login coming soon on iOS 🚀
          </Text>
        )}

        {/* Signup Redirect */}
        <View className="mt-6 flex-row">
          <Text style={{ color: COLORS.subtitle }} className="text-sm">
            New here?
          </Text>
          <Link
            href="/auth/signup-email"
            style={{ color: COLORS.link }}
            className="font-semibold ml-2 text-sm"
          >
            Create Account
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
