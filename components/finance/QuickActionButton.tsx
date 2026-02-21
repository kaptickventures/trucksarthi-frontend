import { Text, TouchableOpacity } from "react-native";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function QuickActionButton({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : "transparent",
      }}
    >
      <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: "700" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

