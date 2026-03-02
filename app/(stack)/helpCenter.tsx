import { Ionicons } from "@expo/vector-icons";
import { Mail, Phone } from "lucide-react-native";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from "react-native";

import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

const PHONE = "9319595984";
const EMAIL = "trucksarthi@gmail.com";

export default function HelpCenter() {
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const openWhatsApp = async () => {
    const url = `https://wa.me/91${PHONE}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert("WhatsApp not installed");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('helpCenter')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>We are available 24x7 to help you</Text>
        </View>

        {/* WhatsApp Card */}
        <View
          className="rounded-2xl p-5 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <TouchableOpacity
            onPress={openWhatsApp}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="bg-[#25D366] p-3 rounded-xl shadow-lg shadow-[#25D366]/40">
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </View>
              <View className="ml-4">
                <Text className="font-semibold text-base" style={{ color: colors.foreground }}>
                  WhatsApp Support
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                  Chat instantly on WhatsApp
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Call Card */}
        <View
          className="rounded-2xl p-5 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${PHONE}`)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="bg-blue-600 p-3 rounded-xl">
                <Phone size={20} color="#fff" />
              </View>
              <View className="ml-4">
                <Text className="font-semibold text-base" style={{ color: colors.foreground }}>
                  Call Support
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                  +91 {PHONE}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Email Card */}
        <View
          className="rounded-2xl p-5 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="bg-orange-500 p-3 rounded-xl">
                <Mail size={20} color="#fff" />
              </View>
              <View className="ml-4">
                <Text className="font-semibold text-base" style={{ color: colors.foreground }}>
                  Email Support
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                  {EMAIL}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
