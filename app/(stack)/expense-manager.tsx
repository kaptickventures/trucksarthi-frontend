import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

export default function ExpenseManagerCompatibilityScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 20 }}>
        <View className="mb-6 px-0 mt-5">
          <Text className="text-3xl font-black" style={{ color: colors.foreground }}>{t('expenseModules')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Select an expense module to manage</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/(stack)/running-expenses" as any)}
          style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>Running Expenses</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>Fuel, Fastag, Loading, Unloading, Challan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(stack)/maintenance-khata" as any)}
          style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>Maintenance Khata</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>Document, Service and Repair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
