import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useThemeStore } from "../../hooks/useThemeStore";

type DriverScreenHeaderProps = {
  title: string;
};

export default function DriverScreenHeader({ title }: DriverScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const goHome = useCallback(() => {
    router.push("/(driver)/(tabs)/home" as any);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goHome();
        return true;
      });

      return () => sub.remove();
    }, [goHome])
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <TouchableOpacity onPress={goHome} style={{ padding: 4 }}>
        <ArrowLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: colors.foreground,
          marginLeft: 12,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
