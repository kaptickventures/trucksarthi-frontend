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
import "../global.css";
import { logout, getUserRole } from "../hooks/useAuth";
import { useThemeStore } from "../hooks/useThemeStore";
import { useUser } from "../hooks/useUser";
import { getFileUrl } from "../lib/utils";
import { Clock, Globe, Bell } from "lucide-react-native";
import { useDriverAppContext } from "../context/DriverAppContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

const FLEET_LINKS = [
  { title: "Trip Log", icon: "clock", route: "/tripLog" as const },
  { title: "Documents", icon: "folder", route: "/documents-manager" as const },
  { title: "Settings", icon: "settings-outline", route: "/settings" as const },
] as const;

const MANAGER_LINKS = [
  { title: "Trucks", icon: "bus-outline", route: "/trucks-manager" as const },
  { title: "Drivers", icon: "person-add-outline", route: "/drivers-manager" as const },
  { title: "Clients", icon: "people-outline", route: "/clients-manager" as const },
  { title: "Locations", icon: "location-outline", route: "/locations-manager" as const },
] as const;

const DRIVER_LINKS = [
  { title: "Home", icon: "home", route: "/(driver)/home" as const },
  { title: "History", icon: "history", route: "/(driver)/history" as const },
  { title: "Khata", icon: "list", route: "/(driver)/ledger" as const },
  { title: "Notifications", icon: "notifications", route: "/(driver)/notifications" as const },
] as const;

export default function SideMenu({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user, loading } = useUser();
  const userRole = getUserRole(user);
  // Driver specific hooks
  const driverContext = useDriverAppContext(true);

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
              inset: 0,
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
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          backgroundColor: colors.background,
          zIndex: 9999,
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
      >
        <View style={{ flex: 1 }}>
          {/* STATIC PROFILE HEADER (Sticky) */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 24, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => navigate("/profile")}>
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
                    {loading ? "Loading..." : user?.name || "Guest"}
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
                <Text className="text-base font-semibold mb-3" style={{ color: colors.mutedForeground }}>
                  MAIN MENU
                </Text>
                {DRIVER_LINKS.map((item, idx) => (
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

                <TouchableOpacity
                  onPress={() => navigate("/settings")}
                  className="flex-row items-center py-4"
                >
                  <Ionicons name="settings-outline" size={24} color={colors.foreground} />
                  <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                    Settings
                  </Text>
                </TouchableOpacity>

                {driverContext && (
                  <TouchableOpacity
                    onPress={() => driverContext.setLanguage(driverContext.language === 'en' ? 'hi' : 'en')}
                    className="flex-row items-center py-4"
                  >
                    <Globe size={24} color={colors.foreground} />
                    <Text className="ml-4 text-lg" style={{ color: colors.foreground }}>
                      {driverContext.language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text className="text-base font-semibold mb-3" style={{ color: colors.mutedForeground }}>
                  MAIN MENU
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
                    MANAGER
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

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-4 mt-4">
              <Ionicons name="log-out-outline" size={26} color="#ef4444" />
              <Text
                className="ml-4 text-lg font-medium"
                style={{ color: "#ef4444" }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
}

