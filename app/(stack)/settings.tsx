// app/settings/index.tsx
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Bell,
  FileDown,
  Fingerprint,
  HelpCircle,
  Languages,
  LogOut,
  MonitorSmartphone,
  Palette,
  User,
  Wallet,
} from "lucide-react-native";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
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

      {/* ===================== ACCOUNT ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">Account</Text>

      {/* Edit Profile */}
      <TouchableOpacity
        onPress={() => router.push("/profile")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <User size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Edit Profile</Text>
        </View>
      </TouchableOpacity>

      {/* Plans & Pricing */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Plans and Pricing placeholder")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <Wallet size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Plans & Pricing</Text>
        </View>
      </TouchableOpacity>

      {/* Export Data */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Export Data placeholder")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-6"
      >
        <View className="flex-row items-center gap-2">
          <FileDown size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Export Data</Text>
        </View>
      </TouchableOpacity>

      {/* ===================== APP PREFERENCES ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">App Preferences</Text>

      {/* Biometric Authentication */}
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Coming Soon", "Biometric Authentication placeholder")
        }
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <Fingerprint size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Biometric Authentication</Text>
        </View>
      </TouchableOpacity>

      {/* App Language */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Language Selection Placeholder")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <Languages size={20} color="#007AFF" />
          <Text className="text-foreground text-base">App Language</Text>
        </View>
      </TouchableOpacity>

      {/* Theme */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Theme Selection Placeholder")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <Palette size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Theme</Text>
        </View>
      </TouchableOpacity>

      {/* Notification Settings */}
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Coming Soon", "Notification Settings Placeholder")
        }
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-6"
      >
        <View className="flex-row items-center gap-2">
          <Bell size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Notification Settings</Text>
        </View>
      </TouchableOpacity>

      {/* ===================== USE ON DESKTOP ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">Desktop</Text>

      <TouchableOpacity
        onPress={() => router.push("https://trucksarthi.com")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-8"
      >
        <View className="flex-row items-center gap-2">
          <MonitorSmartphone size={20} color="#007AFF" />
          <Text className="text-foreground text-base">
            Use Truck Sarthi on Desktop
          </Text>
        </View>
      </TouchableOpacity>

      {/* ===================== SUPPORT ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">Support</Text>

      {/* Help Center */}
      <TouchableOpacity
        onPress={() => router.push("/helpCenter")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-10"
      >
        <View className="flex-row items-center gap-2">
          <HelpCircle size={20} color="#007AFF" />
          <Text className="text-foreground text-base">Help Center</Text>
        </View>
      </TouchableOpacity>

      {/* ===================== LOGOUT ===================== */}
      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center justify-center bg-red-600 p-4 rounded-xl mb-10"
      >
        <LogOut size={20} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
