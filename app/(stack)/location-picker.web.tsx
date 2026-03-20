import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function LocationPickerWeb() {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + 24,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Location Picker
        </Text>
        <Text className="mt-3 text-sm" style={{ color: colors.mutedForeground }}>
          This screen is available in the mobile app.
        </Text>
      </View>
    </View>
  );
}
