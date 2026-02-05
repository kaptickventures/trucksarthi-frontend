import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Mail, Phone, ShieldCheck, Truck, ArrowRight, UserPlus } from "lucide-react-native";
import {
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "../../theme";
import { useThemeStore } from "../../hooks/useThemeStore";

const { width, height } = Dimensions.get("window");

export default function LoginOptions() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Decorative Top Background */}
      <View style={{
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.2,
        width: width * 1.2,
        height: height * 0.5,
        backgroundColor: isDark ? colors.secondary : '#F0FDF4',
        borderBottomLeftRadius: width,
        transform: [{ rotate: '-10deg' }],
        opacity: isDark ? 0.2 : 1
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingVertical: 40 }}>

          {/* Top Section */}
          <View>
            <Image
              source={require("../../assets/images/Trucksarthi-Graphic.png")}
              style={{ width: 180, height: 60, marginBottom: 40, tintColor: isDark ? colors.foreground : undefined }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 42, fontWeight: '900', color: colors.foreground, lineHeight: 48, letterSpacing: -1 }}>
              Your Fleet,{"\n"}
              <Text style={{ color: colors.primary }}>Simplified.</Text>
            </Text>
            <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 16, lineHeight: 24, maxWidth: '80%' }}>
              Welcome back to India's most trusted fleet management companion.
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 1, marginBottom: 8 }}>
              LOG IN WITH
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/auth/login-phone")}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? colors.card : '#111B21',
                paddingVertical: 18,
                paddingHorizontal: 20,
                borderRadius: 18,
                gap: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5,
                borderWidth: isDark ? 1 : 0,
                borderColor: colors.border
              }}
            >
              <View style={{ width: 44, height: 44, backgroundColor: isDark ? colors.background : '#202C33', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={22} color={isDark ? colors.foreground : "#FFFFFF"} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: isDark ? colors.foreground : '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Phone Number</Text>
                <Text style={{ color: isDark ? colors.mutedForeground : '#888888', fontSize: 12 }}>Fast & Secure via OTP</Text>
              </View>
              <ArrowRight size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/auth/login-email-otp")}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                paddingVertical: 18,
                paddingHorizontal: 20,
                borderRadius: 18,
                gap: 16,
                borderWidth: 1.5,
                borderColor: isDark ? colors.border : '#E9ECEF'
              }}
            >
              <View style={{ width: 44, height: 44, backgroundColor: isDark ? colors.background : '#F8F9FA', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={22} color={colors.foreground} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>Email Address</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Sign in with OTP or Pass</Text>
              </View>
              <ArrowRight size={20} color={colors.foreground} />
            </TouchableOpacity>

            {/* Signup Link */}
            <TouchableOpacity
              onPress={() => router.push("/auth/signup-email")}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
                paddingBottom: 20
              }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Don't have an account? </Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>Create One</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Security Note */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '600' }}>
              SECURED BY TRUCKSARTHI SHIELD
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
