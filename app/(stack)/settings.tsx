import { useRouter } from "expo-router";
import {
  Bell,
  FileDown,
  Fingerprint,
  HelpCircle,
  Languages,
  LogOut,
  Monitor,
  MonitorSmartphone,
  Moon,
  Palette,
  Sun,
  Wallet
} from "lucide-react-native";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { logout } from "../../hooks/useAuth";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function Settings() {
  const router = useRouter();
  const { mode, setMode, colors, theme } = useThemeStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const THEME_OPTIONS = [
    { id: "system", label: "System", icon: Monitor },
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-10">
      <Text className="text-3xl font-bold mb-6 text-foreground">Settings</Text>

      {/* ===================== ACCOUNT ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">Account</Text>

      {/* Plans & Pricing */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Plans and Pricing placeholder")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <Wallet size={20} color={colors.primary} />
          <Text className="text-foreground text-base">Plans & Pricing</Text>
        </View>
      </TouchableOpacity>

      {/* Export Data */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Export Data placeholder")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-6"
      >
        <View className="flex-row items-center gap-2">
          <FileDown size={20} color={colors.primary} />
          <Text className="text-foreground text-base">Export Data</Text>
        </View>
      </TouchableOpacity>

      {/* ===================== APP PREFERENCES ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">
        App Preferences
      </Text>

      {/* Theme Trigger */}
      <View className="bg-card p-5 rounded-2xl mb-4 border border-border/50">
        <View className="flex-row items-center gap-3 mb-6">
          <View className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary/20' : 'bg-primary/10'}`}>
            <Palette size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-foreground font-bold text-base">Appearance</Text>
            <Text className="text-muted-foreground text-xs">Customize your workspace</Text>
          </View>
        </View>

        <View className="flex-row bg-muted/30 p-1.5 rounded-2xl gap-1">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = mode === opt.id;

            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setMode(opt.id)}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${isActive ? "bg-background" : "opacity-60"
                  }`}
                style={isActive ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}}
              >
                <Icon size={16} color={isActive ? colors.primary : colors.mutedForeground} />
                <Text
                  className={`font-bold text-xs uppercase tracking-tight ${isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Biometric Authentication */}
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Coming Soon", "Biometric Authentication placeholder")
        }
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <Fingerprint size={20} color={colors.primary} />
          <Text className="text-foreground text-base">
            Biometric Authentication
          </Text>
        </View>
      </TouchableOpacity>

      {/* App Language */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Language Selection placeholder")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-3"
      >
        <View className="flex-row items-center gap-2">
          <Languages size={20} color={colors.primary} />
          <Text className="text-foreground text-base">App Language</Text>
        </View>
      </TouchableOpacity>

      {/* Notification Settings */}
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Coming Soon", "Notification Settings placeholder")
        }
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-6"
      >
        <View className="flex-row items-center gap-2">
          <Bell size={20} color={colors.primary} />
          <Text className="text-foreground text-base">Notification Settings</Text>
        </View>
      </TouchableOpacity>

      {/* ===================== DESKTOP ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">Desktop</Text>

      <TouchableOpacity
        onPress={() => router.push("https://trucksarthi.com")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-8"
      >
        <View className="flex-row items-center gap-2">
          <MonitorSmartphone size={20} color={colors.primary} />
          <Text className="text-foreground text-base">
            Use Truck Sarthi on Desktop
          </Text>
        </View>
      </TouchableOpacity>

      {/* ===================== SUPPORT ===================== */}
      <Text className="text-lg font-semibold text-foreground mb-3">Support</Text>

      <TouchableOpacity
        onPress={() => router.push("/helpCenter")}
        className="flex-row items-center justify-between bg-card p-4 rounded-xl mb-10"
      >
        <View className="flex-row items-center gap-2">
          <HelpCircle size={20} color={colors.primary} />
          <Text className="text-foreground text-base">Help Center</Text>
        </View>
      </TouchableOpacity>

      {/* ===================== LOGOUT ===================== */}
      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center justify-center p-4 rounded-xl mb-10"
        style={{ backgroundColor: colors.destructive }}
      >
        <LogOut size={20} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
