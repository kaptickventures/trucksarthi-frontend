import React, { useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TestScreen() {
  const sheetRef = useRef<BottomSheet>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity
          style={{ padding: 20, backgroundColor: "blue" }}
          onPress={() => {
            console.log("FAB pressed");
            sheetRef.current?.expand();
          }}
        >
          <Text style={{ color: "white" }}>Open Sheet</Text>
        </TouchableOpacity>

        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={["40%", "90%"]}
          enablePanDownToClose
        >
          <View style={{ padding: 20 }}>
            <Text>Bottom Sheet content</Text>
          </View>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
