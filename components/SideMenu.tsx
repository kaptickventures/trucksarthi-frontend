import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Text,
  PanResponder,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SCREEN_WIDTH = Dimensions.get("window").width;

const LINKS = [
  { title: "Add Trip", icon: "car-outline", route: "/addtrip" },
  { title: "History", icon: "time-outline", route: "/history" },
  { title: "Drivers", icon: "person-outline", route: "/manager/drivers-manager" },
  { title: "Clients", icon: "people-outline", route: "/manager/clients-manager" },
  { title: "Locations", icon: "location-outline", route: "/manager/locations-manager" },
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

  // 🎨 Define adaptive theme colors
  const colors = {
    icon: isDark ? "#60A5FA" : "#2563EB", // Tailwind blue-400 / blue-600
    text: isDark ? "#E5E7EB" : "#1F2937", // text-gray-200 / text-gray-800
    border: isDark ? "#374151" : "#E5E7EB",
    background: isDark ? "#0E1116" : "#FFFFFF",
  };

  // 👈 Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40) {
          onClose();
        }
      },
    })
  ).current;

  // 🔄 Animate open/close
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
      {/* 🌑 Background overlay (tap to close) */}
      {isVisible && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0 bg-black/40 z-40" />
        </TouchableWithoutFeedback>
      )}

      {/* 🧭 Slide-in Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: slideAnim }],
          width: SCREEN_WIDTH * 0.55,
          backgroundColor: colors.background,
          borderRightColor: colors.border,
        }}
        className="absolute top-0 left-0 h-full z-50 shadow-2xl p-6 pt-16 
                   rounded-tr-3xl rounded-br-3xl border-r"
      >
        {/* ===== Header with Close Button ===== */}
        <View className="flex-row justify-between items-center mb-6">
          <Text
            className="text-xl font-semibold"
            style={{ color: colors.text }}
          >
            Quick Links
          </Text>

          <TouchableOpacity
            onPress={onClose}
            className="p-2 rounded-full active:bg-accent/40"
          >
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* ===== Menu Links ===== */}
        {LINKS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => navigate(item.route)}
            className="flex-row items-center py-3 border-b rounded-lg"
            style={{ borderBottomColor: colors.border }}
          >
            <Ionicons name={item.icon as any} size={24} color={colors.icon} />
            <Text
              className="ml-4 text-base font-medium"
              style={{ color: colors.text }}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
}
