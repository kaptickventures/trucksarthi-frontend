import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function ExpenseManagerCompatibilityScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Expense Modules</Text>
      </View>

      <View style={{ padding: 20 }}>
        <TouchableOpacity
          onPress={() => router.replace("/(stack)/running-expenses" as any)}
          style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 10 }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>Running Expenses</Text>
          <Text style={{ color: colors.mutedForeground }}>Fuel, Fastag, Loading, Unloading, Challan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(stack)/maintenance-khata" as any)}
          style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>Maintenance Khata</Text>
          <Text style={{ color: colors.mutedForeground }}>Document, Service and Repair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
