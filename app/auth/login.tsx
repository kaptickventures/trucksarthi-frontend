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

const { width, height } = Dimensions.get("window");

export default function LoginOptions() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" />

      {/* Decorative Top Background */}
      <View style={{
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.2,
        width: width * 1.2,
        height: height * 0.5,
        backgroundColor: '#F0FDF4',
        borderBottomLeftRadius: width,
        transform: [{ rotate: '-10deg' }]
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingVertical: 40 }}>

          {/* Top Section */}
          <View>
            <Image
              source={require("../../assets/images/TruckSarthi-Graphic.png")}
              style={{ width: 180, height: 60, marginBottom: 40 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#111B21', lineHeight: 48, letterSpacing: -1 }}>
              Your Fleet,{"\n"}
              <Text style={{ color: THEME.light.primary }}>Simplified.</Text>
            </Text>
            <Text style={{ fontSize: 16, color: '#666666', marginTop: 16, lineHeight: 24, maxWidth: '80%' }}>
              Welcome back to India's most trusted fleet management companion.
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#999999', letterSpacing: 1, marginBottom: 8 }}>
              LOG IN WITH
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/auth/login-phone")}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#111B21',
                paddingVertical: 18,
                paddingHorizontal: 20,
                borderRadius: 18,
                gap: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5
              }}
            >
              <View style={{ width: 44, height: 44, backgroundColor: '#202C33', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={22} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Phone Number</Text>
                <Text style={{ color: '#888888', fontSize: 12 }}>Fast & Secure via OTP</Text>
              </View>
              <ArrowRight size={20} color="#34D399" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/auth/login-email-otp")}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                paddingVertical: 18,
                paddingHorizontal: 20,
                borderRadius: 18,
                gap: 16,
                borderWidth: 1.5,
                borderColor: '#E9ECEF'
              }}
            >
              <View style={{ width: 44, height: 44, backgroundColor: '#F8F9FA', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={22} color="#111B21" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111B21', fontSize: 16, fontWeight: '700' }}>Email Address</Text>
                <Text style={{ color: '#666666', fontSize: 12 }}>Sign in with OTP or Pass</Text>
              </View>
              <ArrowRight size={20} color="#111B21" />
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
              <Text style={{ color: '#666666', fontSize: 14 }}>Don't have an account? </Text>
              <Text style={{ color: THEME.light.primary, fontSize: 14, fontWeight: '700' }}>Create One</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Security Note */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={{ color: '#999999', fontSize: 11, fontWeight: '600' }}>
              SECURED BY TRUCKSARTHI SHIELD
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
