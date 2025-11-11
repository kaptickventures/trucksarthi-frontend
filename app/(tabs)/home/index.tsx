import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import SideMenu from "../../../components/SideMenu";
import "../../../global.css";
import useTrips from "../../../hooks/useTrip";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { loading, totalRevenue, totalTrips, recentTrips } = useTrips(
    firebase_uid || ""
  );

  // 🧭 Header setup
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerLargeTitleStyle: {
        fontWeight: "100000",
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons
            name="menu"
            size={28}
            color={isDark ? "#E5E7EB" : "#111827"}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/profile")}
        >
          <Ionicons
            name="person-circle-outline"
            size={28}
            color={isDark ? "#E5E7EB" : "#111827"}
          />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: isDark
          ? "hsl(var(--background))"
          : "hsl(var(--background))",
      },
    });
  }, [navigation, isDark]);

  if (!firebase_uid) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#A855F7" />
        <Text className="text-muted-foreground mt-2">Loading user...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#A855F7" />
        <Text className="text-muted-foreground mt-2">Loading trips...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-background p-4">
        {/* ====== Stats Section ====== */}
        <View className="flex-row justify-between mb-4">
          {/* Monthly Revenue */}
          <View className="flex-1 bg-card rounded-2xl p-4 mr-2">
            <Text className="text-muted-foreground text-xs">
              Monthly Revenue
            </Text>
            <Text className="text-card-foreground text-xl font-bold mt-1">
              ₹{totalRevenue.toLocaleString()}
            </Text>
            <Text className="text-success text-xs mt-1">▲ +12.5%</Text>
          </View>

          {/* Total Trips */}
          <View className="flex-1 bg-card rounded-2xl p-4 ml-2">
            <Text className="text-muted-foreground text-xs">
              Number of Trips
            </Text>
            <Text className="text-card-foreground text-xl font-bold mt-1">
              {totalTrips}
            </Text>
            <Text className="text-success text-xs mt-1">▲ +8.2%</Text>
          </View>
        </View>

        {/* ====== Add Trip Button ====== */}
        <TouchableOpacity
          onPress={() => router.push("/addtrip")}
          className="bg-primary rounded-full py-4 flex-row justify-center items-center mb-6"
        >
          <Ionicons name="car-outline" size={20} color="white" />
          <Text className="text-primary-foreground font-semibold text-base ml-2">
            Add Trip
          </Text>
        </TouchableOpacity>

        {/* ====== Quick Actions 2x2 Grid ====== */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {[
            {
              title: "Locations",
              icon: "location-outline",
              route: "/locations-manager" as const,
            },
            {
              title: "Drivers",
              icon: "person-add-outline",
              route: "/drivers-manager" as const,
            },
            {
              title: "Clients",
              icon: "people-outline",
              route: "/clients-manager" as const,
            },
            {
              title: "Trucks",
              icon: "bus-outline",
              route: "/trucks-manager" as const,
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(item.route)}
              className="w-[48%] h-32 bg-card rounded-2xl mb-4 items-center justify-center"
            >
              <Ionicons name={item.icon as any} size={28} color="#2563EB" />
              <Text className="text-muted-foreground text-sm mt-2 font-medium">
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ====== Recent Trips ====== */}
        <View className="bg-card rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-card-foreground font-semibold text-lg">
              Recent Trips
            </Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text className="text-muted-foreground text-sm">View All →</Text>
            </TouchableOpacity>
          </View>

          {recentTrips.length > 0 ? (
            recentTrips.map((trip) => (
              <View
                key={trip.trip_id}
                className="flex-row justify-between items-center bg-secondary p-3 rounded-xl mb-2"
              >
                <View className="flex-1">
                  <Text className="text-card-foreground font-medium text-sm">
                    Trip #{trip.trip_id}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    Truck {trip.truck_id} • Driver {trip.driver_id}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary font-semibold">
                    ₹{trip.cost_of_trip.toLocaleString()}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {trip.trip_date}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-muted-foreground text-center py-4">
              No trips found for this user.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* 🧭 Slide-in Menu */}
      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}
