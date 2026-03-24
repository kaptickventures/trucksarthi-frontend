import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../global.css";

import { useThemeStore } from "../hooks/useThemeStore";
import { useUser } from "../hooks/useUser";
import { getFileUrl, formatPhoneNumber } from "../lib/utils";
import { HelpCircle, MonitorSmartphone, Wallet } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

import { useTranslation } from "../context/LanguageContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SideMenu({
  isVisible,
  onClose,
  topOffset,
}: {
  isVisible: boolean;
  onClose: () => void;
  topOffset?: number;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { colors } = useThemeStore();
  const { user, loading } = useUser();
  const { logout } = useAuth();
  const { t } = useTranslation();

  // Render in a modal so positioning isn't affected by parent screen layout differences.
  const [mounted, setMounted] = useState(false);

  // Fallback height in case header height is unavailable (should be rare).
  const DEFAULT_HEADER_HEIGHT = 56;
  const HEADER_DIVIDER_GAP = 2; // keep the drawer below the header border
  const menuTopOffset =
    typeof topOffset === "number"
      ? topOffset
      : (headerHeight || insets.top + DEFAULT_HEADER_HEIGHT);


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
    if (isVisible) {
      setMounted(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 240,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [isVisible, slideAnim]);

  const navigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const handleLogout = async () => {
    try {
      onClose();
      await logout();
      if (typeof router.dismissAll === "function") {
        router.dismissAll();
      }
      router.replace("/auth/login" as any);
    } catch (err) {
      console.log("Logout failed:", err);
    }
  };

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "transparent",
            }}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateX: slideAnim }],
            width: SCREEN_WIDTH * 0.82,
            position: "absolute",
            top: menuTopOffset,
            bottom: 0,
            left: 0,
            backgroundColor: colors.background,
            paddingHorizontal: 24,
            paddingTop: 0,
          }}
        >
          <View style={{ flex: 1 }}>
          {/* STATIC PROFILE HEADER (Sticky) */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 24 }}>
            <TouchableOpacity onPress={() => navigate("/(stack)/profile")} style={{ paddingTop: 12 }}>
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
                  <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                    {loading ? "" : user?.phone ? formatPhoneNumber(user.phone) : user?.email || ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* SCROLLABLE MENU ITEMS */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={() => navigate("/(stack)/plans-pricing")}
              className="flex-row items-center py-4"
            >
              <Wallet size={22} color={colors.foreground} />
              <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                {t('plansPricing')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigate("/(stack)/settings")}
              className="flex-row items-center py-4"
            >
              <Ionicons name="settings-outline" size={24} color={colors.foreground} />
              <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                {t('settings')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigate("/(stack)/desktop-auth")}
              className="flex-row items-center py-4"
            >
              <MonitorSmartphone size={22} color={colors.foreground} />
              <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                {t('useDesktop')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigate("/(stack)/helpCenter")}
              className="flex-row items-center py-4"
            >
              <HelpCircle size={22} color={colors.foreground} />
              <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                {t('helpCenter')}
              </Text>
            </TouchableOpacity>

            {/* Logout as part of the scrollable list */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center py-5 mt-5 mb-12"
              style={{ borderTopWidth: 1, borderTopColor: colors.border }}
            >
              <Ionicons name="log-out-outline" size={26} color={colors.destructive} />
              <Text
                className="ml-4 text-lg font-medium"
                style={{ color: colors.destructive }}
              >
                {t('logout')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
