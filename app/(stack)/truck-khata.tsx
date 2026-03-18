import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";

import { useThemeStore } from "../../hooks/useThemeStore";

export default function TruckKhata() {
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";

  const sections = [
    {
      title: "Daily Khata",
      description: "Fuel, Fastag recharge, challan",
      icon: "speedometer-outline",
      color: colors.destructive,
      bg: colors.destructiveSoft,
      route: "/(stack)/daily-khata",
    },
    {
      title: "Maintenance Khata",
      description: "Service, repair & documents",
      icon: "construct-outline",
      color: colors.warning,
      bg: colors.warningSoft,
      route: "/(stack)/maintenance-khata",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ padding: 20 }}>
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Truck Khata</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Choose a truck expense module</Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Modules</Text>
        <View style={{ gap: 10 }}>
          {sections.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={2}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
