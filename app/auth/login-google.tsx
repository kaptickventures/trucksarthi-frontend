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
import { THEME } from "../../theme";

export default function LoginGoogle() {
  const router = useRouter();

  const handleGoogleLogin = () => {
    Alert.alert("Maintenance", "Google login is currently being upgraded for better security. Please use Phone or Email login for now.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 32 }}>
        {/* Header */}
        <View style={{ paddingTop: 24, paddingBottom: 40 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <ChevronLeft size={28} color="#111B21" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Logo */}
          <Image
            source={require("../../assets/images/TruckSarthi-Graphic.png")}
            style={{ width: 180, height: 60, marginBottom: 40 }}
            resizeMode="contain"
          />

          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111B21', textAlign: 'center' }}>
              Google Authentication
            </Text>
            <Text style={{ fontSize: 16, color: '#666666', marginTop: 8, textAlign: 'center' }}>
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
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#E9ECEF',
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
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111B21' }}>
              Sign in with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/auth/login-phone")}
            style={{ marginTop: 24 }}
          >
            <Text style={{ color: THEME.light.primary, fontWeight: '700', fontSize: 14 }}>
              Use Phone Number instead
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={{ color: '#999999', fontSize: 11, fontWeight: '700' }}>GOOGLE SECURE SESSIONS</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
