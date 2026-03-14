import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

const getSections = (t: any, colors: any) => [
  {
    title: t('clientPL'),
    description: "List report by client",
    icon: "business-outline",
    color: colors.success,
    bg: colors.successSoft,
    route: "/(stack)/pl-client-report",
  },
  {
    title: t('driverPL'),
    description: "List report by driver",
    icon: "people-outline",
    color: colors.warning,
    bg: colors.warningSoft,
    route: "/(stack)/pl-driver-report",
  },
  {
    title: t('truckPL'),
    description: "List report by truck",
    icon: "car-outline",
    color: colors.info,
    bg: colors.infoSoft,
    route: "/(stack)/pl-truck-report",
  },
  {
    title: t('miscPL'),
    description: "List report by misc categories",
    icon: "apps-outline",
    color: colors.destructive,
    bg: colors.destructiveSoft,
    route: "/(stack)/pl-misc-report",
  },
];

export default function PLReportsScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="mb-3">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>
            {t("pLReports")}
          </Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
            Open individual list reports
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {getSections(t, colors).map((item) => (
            <TouchableOpacity
              key={item.route}
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
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: item.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 2 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
