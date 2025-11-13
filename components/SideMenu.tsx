import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
  Image,
  Switch,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

const LINKS = [
  { title: "Home", icon: "home-outline", route: "/home" as const },
  { title: "Profil", icon: "person-outline", route: "/profile" as const },
  { title: "History", icon: "time-outline", route: "/history" as const },
  { title: "Setting", icon: "settings-outline", route: "/settings" as const },
] as const;

type RoutePath = (typeof LINKS)[number]["route"];

export default function SideMenu({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  // Tailwind colors
  const colors = {
    background: isDark ? "hsl(220 15% 8%)" : "hsl(0 0% 100%)",
    text: isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 4%)",
    subtext: isDark ? "hsl(0 0% 75%)" : "hsl(0 0% 40%)",
    border: isDark ? "hsl(220 10% 28%)" : "hsl(0 0% 88%)",
    icon: isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 4%)",
    accent: isDark ? "hsl(217 25% 25%)" : "hsl(220 90% 96%)",
  };

  // Swipe to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) onClose();
      },
    })
  ).current;

  // Drawer animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isVisible]);

  const navigate = (path: RoutePath) => {
    onClose();
    router.push(path);
  };

  return (
    <>
      {/* DIM OVERLAY - MUST BE FULLSCREEN */}
      {isVisible && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 9998,
              elevation: 9998,
            }}
          />
        </TouchableWithoutFeedback>
      )}

      {/* SLIDE MENU - FULLSCREEN & ABOVE NAVBAR */}
<Animated.View
  {...panResponder.panHandlers}
  style={{
    transform: [{ translateX: slideAnim }],
    width: SCREEN_WIDTH,             // FULL WIDTH
    height: "100%",                  // FULL HEIGHT
    position: "absolute",            // FULL ABSOLUTE
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 9999,
    elevation: 9999,
  }}
  className="shadow-2xl px-6 py-10"
>

        {/* HEADER */}
        <View className="flex-row items-center mb-10">
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=3" }}
            className="w-14 h-14 rounded-full"
          />

          <View className="ml-4">
            <Text className="text-xl font-semibold" style={{ color: colors.text }}>
              Hello,
            </Text>
            <Text className="text-sm" style={{ color: colors.subtext }}>
              Adiwara Bestari
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} className="absolute right-0 p-2">
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* THEME TOGGLE */}
        <View className="mb-8">
          <Text className="mb-2 font-medium" style={{ color: colors.text }}>
            Theme
          </Text>

          <View
            className="flex-row items-center justify-between py-3 px-4 rounded-xl"
            style={{ backgroundColor: colors.accent }}
          >
            <Text style={{ color: colors.text }}>Dark Mode</Text>
            <Switch value={isDark} />
          </View>
        </View>

        {/* MENU LIST */}
        {LINKS.map((item, idx) => (
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

        {/* LOGOUT BUTTON */}
        <View className="absolute bottom-10 left-6 flex-row items-center">
          <Ionicons name="log-out-outline" size={26} color={colors.icon} />
          <Text className="ml-3 text-lg font-medium" style={{ color: colors.text }}>
            Logout
          </Text>
        </View>
      </Animated.View>
    </>
  );
}
