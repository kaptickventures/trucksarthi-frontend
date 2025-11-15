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

  // ====================================
  // APPLY TAILWIND THEME COLORS TO HEADER
  // ====================================

  const backgroundColor = isDark
    ? "hsl(220 15% 8%)" // dark --background
    : "hsl(0 0% 100%)"; // light --background

  const foregroundColor = isDark
    ? "hsl(0 0% 98%)" // dark --foreground
    : "hsl(0 0% 4%)"; // light --foreground

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",

      headerStyle: {
        backgroundColor,
      },

      headerTitleStyle: {
        color: foregroundColor,
        fontWeight: "600",
      },

      headerTintColor: foregroundColor, // icons

      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="menu" size={24} color={foregroundColor} />
        </TouchableOpacity>
      ),

      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={foregroundColor}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDark]);

  // ================================
  // LOADING STATES
  // ================================

  if (!firebase_uid) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-muted-foreground mt-2">Loading user...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-muted-foreground mt-2">Loading trips...</Text>
      </View>
    );
  }

  // ================================
  // MAIN SCREEN
  // ================================

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
            <Text className="text-muted-foreground text-xs">Number of Trips</Text>
            <Text className="text-card-foreground text-xl font-bold mt-1">
              {totalTrips}
            </Text>
            <Text className="text-success text-xs mt-1">▲ +8.2%</Text>
          </View>
        </View>

        {/* ====== Add Trip Button ====== */}
        <TouchableOpacity
          onPress={() => router.push("/addTrip")}
          className="bg-primary rounded-full py-4 flex-row justify-center items-center mb-3"
        >
          <Ionicons name="car-outline" size={20} color="white" />
          <Text className="text-primary-foreground font-semibold text-base ml-2">
            Add Trip
          </Text>
        </TouchableOpacity>

        {/* ====== Quick Actions ====== */}
        <View className="flex-row gap-2 justify-between mb-6">
          {[
            { title: "Locations", icon: "location-outline", route: "/locations-manager" },
            { title: "Drivers", icon: "person-add-outline", route: "/drivers-manager" },
            { title: "Clients", icon: "people-outline", route: "/clients-manager" },
            { title: "Trucks", icon: "bus-outline", route: "/trucks-manager" },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(item.route as any)}
              className="flex-1 bg-card rounded-2xl items-center justify-center"
            >
              <View className="p-2 py-4 items-center">
                <Ionicons name={item.icon as any} size={18} color="#2563EB" />
                <Text className="text-muted-foreground text-[8px] mt-1 font-medium">
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ====== Reminders ====== */}
        <View className="bg-card rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-card-foreground font-semibold text-lg">
              Reminders
            </Text>
            <TouchableOpacity onPress={() => router.push("/")}>
              <Text className="text-muted-foreground text-sm">View All →</Text>
            </TouchableOpacity>
          </View>

          {[
            { id: 1, text: "RC renewal due soon", date: "Feb 15, 2025" },
            { id: 2, text: "Insurance expires", date: "Mar 01, 2025" },
          ].map((reminder) => (
            <View
              key={reminder.id}
              className="flex-row justify-between items-center bg-secondary p-3 rounded-xl mb-2"
            >
              <View className="flex-1">
                <Text className="text-card-foreground font-medium text-sm">
                  {reminder.text}
                </Text>
                <Text className="text-muted-foreground text-xs mt-1">
                  Due: {reminder.date}
                </Text>
              </View>
              <Ionicons name="alert-circle-outline" size={20} color="#2563EB" />
            </View>
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

      {/* Slide-in Menu */}
      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}
