import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Slot, useNavigation } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function ManagerLayout() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center bg-card px-4 py-4 border-b border-border">
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="flex-1 text-center text-xl font-semibold text-foreground">
          Manager
        </Text>

        {/* Placeholder to center title */}
        <View className="w-6" />
      </View>

      {/* Screen content */}
      <Slot />
    </View>
  );
}
