import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginGoogle() {
  const router = useRouter();

  const handleGoogleLogin = () => {
    Alert.alert("Not Implemented", "Google Login is temporarily disabled during system migration.");
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-10">

      {/* Logo */}
      <Image
        source={require("../../assets/images/TruckSarthi-Graphic.png")}
        style={{ width: "65%", height: 90, marginBottom: 40 }}
        resizeMode="contain"
      />

      <Text className="text-3xl font-bold mb-4 text-center">
        Continue with Google
      </Text>

      {/* Google Login Button */}
      <TouchableOpacity
        onPress={handleGoogleLogin}
        className="w-full py-3 rounded-xl items-center bg-[#DB4437]"
      >
        <Text className="text-white font-semibold text-lg">
          Login with Google
        </Text>
      </TouchableOpacity>

      {/* Back to email/phone login */}
      <TouchableOpacity onPress={() => router.back()} className="mt-6">
        <Text className="text-[#128C7E]">Go Back</Text>
      </TouchableOpacity>

    </View>
  );
}
