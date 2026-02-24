import { Plus } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function FinanceFAB({ onPress }: { onPress: () => void }) {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        position: "absolute",
        right: 24,
        bottom: 32,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Plus size={28} color={colors.primaryForeground} />
    </TouchableOpacity>
  );
}
