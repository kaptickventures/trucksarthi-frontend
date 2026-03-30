import React, { useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useThemeStore } from "../hooks/useThemeStore";

export default function TestSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const { colors } = useThemeStore();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity
        style={{ backgroundColor: colors.primary, padding: 20 }}
        onPress={() => sheetRef.current?.expand()}
      >
        <Text style={{ color: colors.primaryForeground, fontWeight: "bold" }}>Open Sheet</Text>
      </TouchableOpacity>

      <BottomSheet ref={sheetRef} snapPoints={["25%", "50%"]} index={-1}>
        <View style={{ padding: 20 }}>
          <Text>Sheet Opened 🎉</Text>
        </View>
      </BottomSheet>
    </View>
  );
}
