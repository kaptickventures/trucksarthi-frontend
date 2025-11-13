// app/(tabs)/history-stack/_layout.tsx
import React from "react";
import NativeStack from "expo-router/stack";
import { PlatformColor, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HistoryStack() {
  return (
    <NativeStack
      screenOptions={{
        headerLargeTitle: true,
        headerBlurEffect: "systemMaterial",
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      <NativeStack.Screen
        name="index"
        options={{
          title: "Trip History",
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: "Search trips...",
          },
          // Optional: add help or filter icons in the header
          headerRight: () => (
            <TouchableOpacity onPress={() => console.log("Help pressed")}>
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={PlatformColor("systemGrayColor")}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </NativeStack>
  );
}
