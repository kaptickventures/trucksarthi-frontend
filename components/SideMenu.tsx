import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";
import { useUser } from "../hooks/useUser";

const SCREEN_WIDTH = Dimensions.get("window").width;

const LINKS = [
  { title: "Trip Log", icon: "time", route: "/tripLog" as const },
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
  const isDark = colorScheme === "dark";
  const { user, loading } = useUser();

  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  const colors = {
    background: isDark ? "hsl(222 14% 10%)" : "hsl(0 0% 100%)",
    text: isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 10%)",
    subtext: isDark ? "hsl(0 0% 70%)" : "hsl(0 0% 40%)",
    icon: isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 10%)",
    accent: isDark ? "hsl(217 25% 20%)" : "hsl(220 90% 96%)",
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
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isVisible]);

  const navigate = (path: RoutePath) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
      router.replace("/auth/login");
    } catch (err) {
      console.log("Logout failed:", err);
    }
  };

  return (
    <>
      {/* Dim overlay */}
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
            }}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: slideAnim }],
          width: SCREEN_WIDTH,
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
          {/* Header */}
          <TouchableOpacity onPress={() => navigate("/profile")}>
          <View className="flex-row items-center mb-10">
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                overflow: "hidden",
                backgroundColor: "#ccc",
              }}
            >
              {user?.profile_picture_url ? (
                <Image
                  source={{ uri: user.profile_picture_url }}
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

            <TouchableOpacity onPress={onClose} className="absolute right-0 p-2">
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>
          </TouchableOpacity>

          {/* Theme toggle */}
          <View className="mb-10">
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

          {/* Main menu */}
          <Text className="text-base font-semibold mb-3" style={{ color: colors.subtext }}>
            MAIN MENU
          </Text>

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

          {/* Manager section */}
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

          {/* Logout — now NORMAL position (not fixed) */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center py-4"
          >
            <Ionicons name="log-out-outline" size={26} color={colors.icon} />
            <Text
              className="ml-4 text-lg font-medium"
              style={{ color: colors.text }}
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
