import { Text, View } from "react-native";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function SummaryStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const { colors } = useThemeStore();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
      }}
    >
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

