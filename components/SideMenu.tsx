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
  useColorScheme,
  View,
} from "react-native";
import "../global.css";
import { logout } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { getFileUrl } from "../lib/utils";
import { THEME } from "../theme";

// 👉 Added Lucide Icon
import { Clock } from "lucide-react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

const LINKS = [
  { title: "Trip Log", icon: "clock", route: "/tripLog" as const },
  { title: "Settings", icon: "settings-outline", route: "/settings" as const },
] as const;

const MANAGER_LINKS = [
  { title: "Trucks", icon: "bus-outline", route: "/trucks-manager" as const },
  { title: "Drivers", icon: "person-add-outline", route: "/drivers-manager" as const },
  { title: "Clients", icon: "people-outline", route: "/clients-manager" as const },
  { title: "Locations", icon: "location-outline", route: "/locations-manager" as const },
] as const;

type RoutePath =
  | "/profile"
  | (typeof LINKS)[number]["route"]
  | (typeof MANAGER_LINKS)[number]["route"];

export default function SideMenu({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = THEME[colorScheme === "dark" ? "dark" : "light"];
  const { user, loading } = useUser();

  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  const colors = {
    background: theme.background,
    overlay: "rgba(0,0,0,0.45)",
    text: theme.foreground,
    subtext: theme.mutedForeground,
    icon: theme.foreground,
    avatarBg: theme.muted,
    divider: theme.border,
    highlight: theme.primary,
  };

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
  }, [isVisible]);

  const navigate = (path: RoutePath) => {
    onClose();
    router.push(path);
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

  return (
    <>
      {isVisible && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: colors.overlay,
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile */}
          <TouchableOpacity onPress={() => navigate("/profile")}>
            <View className="flex-row items-center mb-10">
              <View
                className="w-16 h-16 rounded-full overflow-hidden items-center justify-center"
                style={{ backgroundColor: colors.avatarBg }}
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
                    color={colors.icon}
                    style={{ opacity: 0.6 }}
                  />
                )}
              </View>

              <View className="ml-4">
                <Text className="text-xl font-semibold" style={{ color: colors.text }}>
                  {loading ? "Loading..." : user?.full_name || "Guest"}
                </Text>
                <Text className="text-sm" style={{ color: colors.subtext }}>
                  {user?.email_address || ""}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* MAIN MENU */}
          <Text className="text-base font-semibold mb-3" style={{ color: colors.subtext }}>
            MAIN MENU
          </Text>

          {LINKS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => navigate(item.route)}
              className="flex-row items-center py-4"
            >
              {item.title === "Trip Log" ? (
                <Clock size={24} color={colors.icon} />
              ) : (
                <Ionicons name={item.icon as any} size={24} color={colors.icon} />
              )}

              <Text className="ml-4 text-lg" style={{ color: colors.text }}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}

          {/* MANAGER SECTION */}
          <View className="mt-8 mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.subtext }}>
              MANAGER
            </Text>

            {MANAGER_LINKS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => navigate(item.route)}
                className="flex-row items-center py-4"
              >
                <Ionicons name={item.icon as any} size={24} color={colors.icon} />
                <Text className="ml-4 text-lg" style={{ color: colors.text }}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-4">
            <Ionicons name="log-out-outline" size={26} color="#ef4444" />
            <Text
              className="ml-4 text-lg font-medium"
              style={{ color: "#ef4444" }}
            >
              Logout
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </>
  );
}
