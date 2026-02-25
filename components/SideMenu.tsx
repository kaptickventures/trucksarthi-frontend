import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../global.css";
import { logout, getUserRole } from "../hooks/useAuth";
import { useThemeStore } from "../hooks/useThemeStore";
import { useUser } from "../hooks/useUser";
import { getFileUrl } from "../lib/utils";
import { Clock, Globe, Bell } from "lucide-react-native";
import { useDriverAppContext } from "../context/DriverAppContext";

import { useTranslation } from "../context/LanguageContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SideMenu({
  isVisible,
  onClose,
  topOffset = 0,
}: {
  isVisible: boolean;
  onClose: () => void;
  topOffset?: number;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { user, loading } = useUser();
  const { t, language, setLanguage } = useTranslation();
  const userRole = getUserRole(user);
  // Driver specific hooks
  const driverContext = useDriverAppContext(true);

  const FLEET_LINKS = [
    { title: t('tripLog'), icon: "clock", route: "/(tabs)/tripLog" as const },
    { title: t('documents'), icon: "folder", route: "/(stack)/documents-manager" as const },
    { title: t('settings'), icon: "settings-outline", route: "/(stack)/settings" as const },
  ] as const;

  const MANAGER_LINKS = [
    { title: t('financeHub'), icon: "wallet-outline", route: "/(stack)/finance" as const },
    { title: t('trucks'), icon: "bus-outline", route: "/(stack)/trucks-manager" as const },
    { title: t('drivers'), icon: "person-add-outline", route: "/(stack)/drivers-manager" as const },
    { title: t('clients'), icon: "people-outline", route: "/(stack)/clients-manager" as const },
    { title: t('locations'), icon: "location-outline", route: "/(stack)/locations-manager" as const },
  ] as const;

  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) onClose();
      },
    })
  ).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -SCREEN_WIDTH,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [isVisible, slideAnim]);

  const navigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const handleLogout = async () => {
    try {
      onClose();
      setTimeout(async () => {
        await logout();
        router.dismissAll();
        router.replace("/auth/login");
      }, 150);
    } catch (err) {
      console.log("Logout failed:", err);
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    await setLanguage(newLang);
    // Also sync with driver context if it exists
    if (driverContext) {
      await driverContext.setLanguage(newLang);
    }
  };

  const renderIcon = (iconName: string, size = 24) => {
    if (iconName === "clock" || iconName === "history") return <Clock size={size} color={colors.foreground} />;
    if (iconName === "folder") return <Ionicons name="folder-outline" size={size} color={colors.foreground} />;
    if (iconName === "list") return <Ionicons name="list-outline" size={size} color={colors.foreground} />;
    if (iconName === "home") return <Ionicons name="home-outline" size={size} color={colors.foreground} />;
    if (iconName === "notifications") return <Bell size={size} color={colors.foreground} />;
    return <Ionicons name={iconName as any} size={size} color={colors.foreground} />;
  };

  return (
    <>
      {isVisible && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: "absolute",
              top: topOffset,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              zIndex: 9998,
            }}
          />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: slideAnim }],
          width: SCREEN_WIDTH * 0.82,
          position: "absolute",
          top: topOffset,
          bottom: 0,
          left: 0,
          backgroundColor: colors.background,
          zIndex: 9999,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 20),
        }}
      >
        <View style={{ flex: 1 }}>
          {/* STATIC PROFILE HEADER (Sticky) */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 24, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => navigate(userRole === "driver" ? "/(driver)/profile" : "/(stack)/profile")}>
              <View className="flex-row items-center">
                <View
                  className="w-16 h-16 rounded-full overflow-hidden items-center justify-center"
                  style={{ backgroundColor: colors.muted }}
                >
                  {user?.profile_picture_url ? (
                    <Image
                      source={{ uri: getFileUrl(user.profile_picture_url) || "" }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Ionicons
                      name="person-circle-outline"
                      size={58}
                      color={colors.foreground}
                      style={{ opacity: 0.6 }}
                    />
                  )}
                </View>

                <View className="ml-4">
                  <Text className="text-xl font-semibold" style={{ color: colors.foreground }}>
                    {loading ? t('loading') : user?.name || "Guest"}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    {user?.email || user?.phone || ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* SCROLLABLE MENU ITEMS */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {userRole === "driver" ? (
              <>
                <TouchableOpacity
                  onPress={() => navigate("/(driver)/settings")}
                  className="flex-row items-center py-4"
                >
                  <Ionicons name="settings-outline" size={24} color={colors.foreground} />
                  <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                    {t('settings')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigate("/(driver)/notifications")}
                  className="flex-row items-center py-4"
                >
                  <Bell size={24} color={colors.foreground} />
                  <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                    {t('notifications')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-base font-semibold mb-3" style={{ color: colors.mutedForeground }}>
                  {t('mainMenu')}
                </Text>
                {FLEET_LINKS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => navigate(item.route)}
                    className="flex-row items-center py-4"
                  >
                    {renderIcon(item.icon)}
                    <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* MANAGER SECTION */}
                <View className="mt-8 mb-6">
                  <Text className="text-base font-semibold mb-3" style={{ color: colors.mutedForeground }}>
                    {t('manager')}
                  </Text>
                  {MANAGER_LINKS.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => navigate(item.route)}
                      className="flex-row items-center py-4"
                    >
                      {renderIcon(item.icon)}
                      <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Language Toggle for everyone */}
            <TouchableOpacity
              onPress={toggleLanguage}
              className="flex-row items-center py-4"
            >
              <Globe size={24} color={colors.foreground} />
              <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                {language === 'en' ? t('switchHindi') : t('switchEnglish')}
              </Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-4 mt-4">
              <Ionicons name="log-out-outline" size={26} color="#ef4444" />
              <Text
                className="ml-4 text-lg font-medium"
                style={{ color: "#ef4444" }}
              >
                {t('logout')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
}

