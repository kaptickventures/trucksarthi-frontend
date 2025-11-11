// app/settings/index.tsx
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { HelpCircle, LogOut, User } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function Settings() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-10">
      <Text className="text-3xl font-bold mb-6 text-foreground">Settings</Text>

      {/* Account */}
      <Text className="text-lg font-semibold text-foreground mb-3">Account</Text>

      <TouchableOpacity
        onPress={() => router.push("/profile")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center space-x-3">
          <User size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Edit Profile</Text>
        </View>
      </TouchableOpacity>

      {/* Support */}
      <Text className="text-lg font-semibold text-foreground mt-6 mb-3">Support</Text>

      <TouchableOpacity
        onPress={() => router.push("/helpCenter")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center space-x-3">
          <HelpCircle size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Help Center</Text>
        </View>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center justify-center bg-red-600 p-4 rounded-xl mt-10 mb-10"
      >
        <LogOut size={20} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
