import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Truck, Users, Building2, MapPin } from "lucide-react-native";

type Section = {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

const sections: Section[] = [
  { name: "Trucks", path: "manager/trucks-manager", icon: Truck },
  { name: "Drivers", path: "manager/drivers-manager", icon: Users },
  { name: "Clients", path: "manager/clients-manager", icon: Building2 },
  { name: "Locations", path: "manager/locations-manager", icon: MapPin },
];


export default function ManagerHome() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isRoot = route.name === "manager";

  return (
    <View className="flex-1 bg-background pb-20">


      {/* Root view */}
      {isRoot ? (
        <View className="flex-row flex-wrap justify-center p-4 gap-4">
          {sections.map((section) => {
            const IconComponent = section.icon; // ✅ extract component
            return (
              <TouchableOpacity
                key={section.path}
                className="w-[44%] bg-card border border-border rounded-2xl p-6 items-center justify-center active:opacity-80"
                onPress={() => navigation.navigate(section.path)}
              >
                <IconComponent size={40} color="#111827" />
                <Text className="mt-2 font-semibold text-foreground">
                  {section.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <>
          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="border-b border-border bg-card"
          >
            {sections.map((section) => {
              const isActive = route.name === section.path;
              return (
                <TouchableOpacity
                  key={section.path}
                  className={`px-4 py-3 border-b-2 ${
                    isActive ? "border-accent" : "border-transparent"
                  }`}
                  onPress={() => navigation.navigate(section.path)}
                >
                  <Text
                    className={`font-medium ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {section.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}
