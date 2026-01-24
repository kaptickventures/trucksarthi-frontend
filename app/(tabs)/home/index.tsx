import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
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
import { useUser } from "../../../hooks/useUser";
import { THEME } from "../../../theme";


export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user, loading: userLoading } = useUser();
  const { loading: tripsLoading, totalRevenue, totalTrips, recentTrips } = useTrips();

  const loading = userLoading || tripsLoading;

  // ====================================
  // APPLY TAILWIND THEME COLORS TO HEADER
  // ====================================

  const backgroundColor = isDark
    ? THEME.dark.background
    : THEME.light.background;

  const foregroundColor = isDark
    ? THEME.dark.foreground
    : THEME.light.foreground;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor },
      headerTitleStyle: {
        color: foregroundColor,
        fontWeight: "600",
      },
      headerTintColor: foregroundColor,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={menuVisible ? "close" : "menu"}
            size={24}
            color={foregroundColor}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
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
  }, [navigation, isDark, menuVisible, backgroundColor, foregroundColor]);

  if (loading && !user) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-muted-foreground mt-2">Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-background p-4">
        {/* ====== Stats Section ====== */}
        <View className="flex-row justify-between mb-4">
          <View className="flex-1 bg-card rounded-2xl p-4 mr-2">
            <Text className="text-muted-foreground text-xs">Monthly Revenue</Text>
            <Text className="text-card-foreground text-xl font-bold mt-1">
              ₹{totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-4 ml-2">
            <Text className="text-muted-foreground text-xs">Number of Trips</Text>
            <Text className="text-card-foreground text-xl font-bold mt-1">
              {totalTrips}
            </Text>
          </View>
        </View>

        {/* ====== Add Trip Button ====== */}
        <TouchableOpacity
          onPress={() => router.push("/addTrip")}
          className="bg-primary rounded-full p-4 flex-row justify-center items-center mb-3"
        >
          <Ionicons name="bus-outline" size={20} color="white" />
          <Text className="text-primary-foreground font-semibold text-base ml-2">Add Trip</Text>
        </TouchableOpacity>

        {/* ====== Quick Actions ====== */}
        <View className="flex-row gap-2 justify-between mt-2 mb-6">
          {[
            { title: "Trucks", icon: "bus-outline", route: "/trucks-manager" },
            { title: "Drivers", icon: "person-add-outline", route: "/drivers-manager" },
            { title: "Clients", icon: "people-outline", route: "/clients-manager" },
            { title: "Locations", icon: "location-outline", route: "/locations-manager" },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(item.route as any)}
              className="flex-1 bg-card rounded-2xl items-center justify-center"
            >
              <View className="p-2 py-4 items-center">
                <Ionicons name={item.icon as any} size={18} color="#25D366" />
                <Text className="text-muted-foreground text-[8px] mt-1 font-medium">{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ====== Recent Trips ====== */}
        <View className="bg-card rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-card-foreground font-semibold text-lg">Recent Trips</Text>
            <TouchableOpacity onPress={() => router.push("/tripLog")}>
              <Text className="text-muted-foreground text-sm">View All →</Text>
            </TouchableOpacity>
          </View>

          {recentTrips.length > 0 ? (
            recentTrips.map((trip) => {
              const getId = (obj: any): string =>
                typeof obj === "object" ? obj?._id : obj;
              const tripId = trip._id;
              const truckId = getId(trip.truck);
              const driverId = getId(trip.driver);
              const dateStr = trip.trip_date
                ? new Date(trip.trip_date).toLocaleDateString("en-IN")
                : "No Date";
              const cost = trip.cost_of_trip ?? 0;

              return (
                <View
                  key={tripId}
                  className="flex-row justify-between items-center bg-secondary p-3 rounded-xl mb-2"
                >
                  <View className="flex-1">
                    <Text className="text-card-foreground font-medium text-sm">
                      Trip #{tripId.slice(-6)}
                    </Text>
                    <Text className="text-muted-foreground text-[10px] mt-1">
                      Truck: {truckId.slice(-6)} • Driver: {driverId.slice(-6)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-primary font-semibold">
                      ₹{cost.toLocaleString()}
                    </Text>
                    <Text className="text-muted-foreground text-[10px]">
                      {dateStr}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-muted-foreground text-center py-4">
              No trips found.
            </Text>
          )}
        </View>
      </ScrollView>

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}
