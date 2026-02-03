// app/auth/login.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Mail, Phone } from "lucide-react-native";
import {
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

        {/* Email OTP Login */}
        <TouchableOpacity
          onPress={() => router.push("/auth/login-email-otp")}
          className="flex-row items-center justify-center w-full py-3 rounded-xl mb-4 border"
          style={{
            backgroundColor: COLORS.buttonBg,
            borderColor: COLORS.buttonBorder,
          }}
        >
          <Mail size={20} color="#111B21" />
          <Text className="ml-2 font-semibold">Continue with Email OTP</Text>
        </TouchableOpacity>


        {/* Signup Redirect */}
        <View className="mt-6 flex-row">
          <Text style={{ color: COLORS.subtitle }} className="text-sm">
            New here?
          </Text>

          <TouchableOpacity onPress={() => router.push("/auth/signup-email")}>
            <Text style={{ color: COLORS.link }} className="font-semibold ml-2 text-sm">
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
