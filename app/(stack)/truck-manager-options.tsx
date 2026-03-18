import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, Truck } from "lucide-react-native";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";

import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";

export default function TruckManagerOptions() {
  const router = useRouter();
  const { truckId } = useLocalSearchParams<{ truckId: string }>();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const { trucks } = useTrucks();

  const truck = trucks.find((t) => String(t._id) === String(truckId));
  const truckNumber = truck?.registration_number || "Truck";

  const options = [
    {
      title: "Truck Profile",
      description: "View and update truck details",
      icon: <Truck size={22} color={colors.primary} />,
      route: "/(stack)/trucks-profile",
      params: { truck_id: truckId },
    },
    {
      title: "Document Manager",
      description: "Insurance, permits & documents",
      icon: <FileText size={22} color={colors.primary} />,
      route: "/(stack)/document-details",
      params: { truckId },
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ padding: 20 }}>
        <View className="mb-4">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>
            Truck Manager
          </Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
            {truckNumber}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {options.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push({ pathname: item.route, params: item.params } as any)}
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
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.primary + "12",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </View>
                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={2}>
                    {item.description}
                  </Text>
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
