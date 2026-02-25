import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from "expo-router";
import {
  Bell,
  Fingerprint,
  HelpCircle,
  Languages,
  LogOut,
  MonitorSmartphone,
  Moon,
  Palette,
  Sun,
  Wallet
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { logout } from "../../hooks/useAuth";
import { useTranslation } from "../../context/LanguageContext";

import { useThemeStore } from "../../hooks/useThemeStore";

const BIOMETRIC_KEY = "@user_biometric_enabled";

export default function Settings() {
  const router = useRouter();
  const { mode, setMode, colors } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);

      const saved = await AsyncStorage.getItem(BIOMETRIC_KEY);
      setIsBiometricEnabled(saved === "true");
    })();
  }, []);

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable biometrics",
        fallbackLabel: "Use Passcode",
      });
      if (result.success) {
        setIsBiometricEnabled(true);
        await AsyncStorage.setItem(BIOMETRIC_KEY, "true");
        Alert.alert("Success", "Biometric login enabled!");
      } else {
        Alert.alert("Failed", "Authentication failed.");
        setIsBiometricEnabled(false);
      }
    } else {
      setIsBiometricEnabled(false);
      await AsyncStorage.setItem(BIOMETRIC_KEY, "false");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const THEME_OPTIONS = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <ScrollView className="flex-1 px-5 pt-10" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />
      <Text className="text-3xl font-bold mb-6" style={{ color: colors.foreground }}>{t('settings')}</Text>

      {/* ===================== ACCOUNT ===================== */}
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>{t('account')}</Text>

      {/* Plans & Pricing */}
      <TouchableOpacity
        onPress={() => Alert.alert("Coming Soon", "Plans and Pricing placeholder")}
        className="flex-row items-center justify-between p-4 rounded-xl mb-3 border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <Wallet size={20} color={colors.primary} />
          <Text className="text-base" style={{ color: colors.foreground }}>{t('plansPricing')}</Text>
        </View>
      </TouchableOpacity>



      {/* ===================== APP PREFERENCES ===================== */}
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>
        {t('appPreferences')}
      </Text>

      {/* Theme Trigger */}
      <View
        className="p-5 rounded-2xl mb-4 border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-3 mb-6">
          <View className={`p-2 rounded-lg`}>
            <Palette size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="font-bold text-base" style={{ color: colors.foreground }}>{t('appearance')}</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>{t('customizeWorkspace')}</Text>
          </View>
        </View>

        <View className="flex-row p-1.5 rounded-2xl gap-1" style={{ backgroundColor: colors.muted + '4D' }}>
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = mode === opt.id;

            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setMode(opt.id)}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${!isActive ? "opacity-60" : ""}`}
                style={isActive ? {
                  backgroundColor: colors.background,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}}
              >
                <Icon size={16} color={isActive ? colors.primary : colors.mutedForeground} />
                <Text
                  className={`font-bold text-xs uppercase tracking-tight`}
                  style={{ color: isActive ? colors.foreground : colors.mutedForeground }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Biometric Authentication */}
      {isBiometricSupported && (
        <View
          className="flex-row items-center justify-between p-4 rounded-xl mb-3 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center gap-2">
            <Fingerprint size={20} color={colors.primary} />
            <Text className="text-base" style={{ color: colors.foreground }}>
              {t('biometricLogin')}
            </Text>
          </View>
          <Switch
            value={isBiometricEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor="#f4f3f4"
          />
        </View>
      )}

      {/* App Language */}
      <TouchableOpacity
        onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        className="flex-row items-center justify-between p-4 rounded-xl mb-3 border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <Languages size={20} color={colors.primary} />
          <Text className="text-base" style={{ color: colors.foreground }}>
            {t('language')}: {language === 'en' ? 'English' : 'Hindi'}
          </Text>
        </View>
        <Text style={{ color: colors.primary, fontWeight: '500' }}>{t('changeLanguage')}</Text>
      </TouchableOpacity>

      {/* Notification Settings Toggle */}
      <View
        className="flex-row items-center justify-between p-4 rounded-xl mb-6 border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-2 flex-1">
          <Bell size={20} color={colors.primary} />
          <View>
            <Text className="text-base" style={{ color: colors.foreground }}>{t('pushNotifications')}</Text>
            <TouchableOpacity onPress={() => router.push("/(stack)/notifications" as any)}>
              <Text style={{ color: colors.primary, fontSize: 10 }}>{t('viewHistory')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Switch
          value={isNotificationsEnabled}
          onValueChange={(val) => {
            setIsNotificationsEnabled(val);
            if (!val) {
              Alert.alert(
                "Notifications Disabled",
                "You will no longer receive alerts for new trips and updates.",
                [{ text: "OK" }]
              );
            }
          }}
          trackColor={{ false: colors.muted, true: colors.primary }}
          thumbColor="#f4f3f4"
        />
      </View>

      {/* ===================== DESKTOP ===================== */}
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>{t('desktop')}</Text>

      <TouchableOpacity
        onPress={() => router.push("https://trucksarthi.com")}
        className="flex-row items-center justify-between p-4 rounded-xl mb-8 border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <MonitorSmartphone size={20} color={colors.primary} />
          <Text className="text-base" style={{ color: colors.foreground }}>
            {t('useDesktop')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ===================== SUPPORT ===================== */}
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>{t('support')}</Text>

      <TouchableOpacity
        onPress={() => router.push("/(stack)/helpCenter")}
        className="flex-row items-center justify-between p-4 rounded-xl mb-10 border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <HelpCircle size={20} color={colors.primary} />
          <Text className="text-base" style={{ color: colors.foreground }}>{t('helpCenter')}</Text>
        </View>
      </TouchableOpacity>

      {/* ===================== LOGOUT ===================== */}
      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center justify-center p-4 rounded-xl mb-10"
        style={{ backgroundColor: colors.destructive }}
      >
        <LogOut size={20} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
