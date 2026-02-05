import { useRouter } from "expo-router";
import { ChevronLeft, ShieldCheck } from "lucide-react-native";
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function LoginGoogle() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const handleGoogleLogin = () => {
    Alert.alert("Maintenance", "Google login is currently being upgraded for better security. Please use Phone or Email login for now.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 32 }}>
        {/* Header */}
        <View style={{ paddingTop: 24, paddingBottom: 40 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <ChevronLeft size={28} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Logo */}
          <Image
            source={require("../../assets/images/TruckSarthi-Graphic.png")}
            style={{ width: 180, height: 60, marginBottom: 40, tintColor: isDark ? colors.foreground : undefined }}
            resizeMode="contain"
          />

          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
              Google Authentication
            </Text>
            <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
              Seamless access with your Google account
            </Text>
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderWidth: 1.5,
              borderColor: isDark ? colors.border : '#E9ECEF',
              paddingVertical: 18,
              borderRadius: 16,
              gap: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2
            }}
          >
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
              style={{ width: 24, height: 24 }}
            />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
              Sign in with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/auth/login-phone")}
            style={{ marginTop: 24 }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
              Use Phone Number instead
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>GOOGLE SECURE SESSIONS</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
