
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import SideMenu from "../../../components/SideMenu";
import { Skeleton } from "../../../components/Skeleton";
import "../../../global.css";
import { useThemeStore } from "../../../hooks/useThemeStore";
import useTrips from "../../../hooks/useTrip";
import { useUser } from "../../../hooks/useUser";
import useTruckDocuments from "../../../hooks/useTruckDocuments";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const { user, loading: userLoading, refreshUser } = useUser();
  const { loading: tripsLoading, totalRevenue, totalTrips, recentTrips, fetchTrips } = useTrips();
  const { documents, loading: docsLoading } = useTruckDocuments();

  // Filter expiring documents (next 30 days)
  const expiringDocs = documents.filter(doc => {
    if (!doc.expiry_date || doc.status === 'expired') return false;
    const expiry = new Date(doc.expiry_date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  const loading = userLoading || tripsLoading || docsLoading;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: {
        color: colors.foreground,
        fontWeight: "600",
      },
      headerTintColor: colors.foreground,
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
            color={colors.foreground}
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
            color={colors.foreground}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, menuVisible]);

  if (loading && !user) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} className="flex-1 p-4">
        {/* Stats Skeleton */}
        <View className="flex-row justify-between mb-4">
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16, marginRight: 8 }} />
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16, marginLeft: 8 }} />
        </View>

        {/* Add Trip Button Skeleton */}
        <Skeleton width="100%" height={56} borderRadius={28} style={{ marginBottom: 12 }} />

        {/* Quick Actions Skeleton */}
        <View className="flex-row gap-2 justify-between mt-2 mb-6">
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16 }} />
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16 }} />
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16 }} />
          <Skeleton style={{ flex: 1, height: 80, borderRadius: 16 }} />
        </View>

        {/* Recent Trips Skeleton */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Skeleton width={120} height={20} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} width="100%" height={70} borderRadius={12} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        className="flex-1 p-4"
      >
        {/* ====== Stats Section ====== */}
        <View className="flex-row justify-between mb-4">
          <View style={{ backgroundColor: colors.card }} className="flex-1 rounded-2xl p-4 mr-2">
            <Text className="text-muted-foreground text-xs">Monthly Revenue</Text>
            <Text style={{ color: colors.foreground }} className="text-xl font-bold mt-1">
              ₹{totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={{ backgroundColor: colors.card }} className="flex-1 rounded-2xl p-4 ml-2">
            <Text className="text-muted-foreground text-xs">Number of Trips</Text>
            <Text style={{ color: colors.foreground }} className="text-xl font-bold mt-1">
              {totalTrips}
            </Text>
          </View>
        </View>

        {/* ====== Add Trip Button ====== */}
        <TouchableOpacity
          onPress={() => router.push("/addTrip")}
          style={{ backgroundColor: colors.primary }}
          className="rounded-full p-4 flex-row justify-center items-center mb-3"
        >
          <Ionicons name="bus-outline" size={20} color="white" />
          <Text style={{ color: colors.primaryForeground }} className="font-semibold text-base ml-2">Add Trip</Text>
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
              style={{ backgroundColor: colors.card }}
              className="flex-1 rounded-2xl items-center justify-center"
            >
              <View className="p-2 py-4 items-center">
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                <Text className="text-muted-foreground text-[8px] mt-1 font-medium">{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ====== Reminders Card ====== */}
        {expiringDocs.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/documents-manager" as any)}
            style={{ backgroundColor: '#FEF2F2' }} // light red bg
            className="rounded-2xl p-4 mb-6 border border-red-100"
          >
            <View className="flex-row items-center mb-2">
              <View className="bg-red-100 p-2 rounded-full mr-3">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
              </View>
              <View>
                <Text className="text-red-800 font-bold text-base">Action Required</Text>
                <Text className="text-red-600 text-xs">
                  {expiringDocs.length} documents expiring soon
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ====== Recent Trips ====== */}
        <View style={{ backgroundColor: colors.card }} className="rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.foreground }} className="font-semibold text-lg">Recent Trips</Text>
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
                  style={{ backgroundColor: colors.secondary }}
                  className="flex-row justify-between items-center p-3 rounded-xl mb-2"
                >
                  <View className="flex-1">
                    <Text style={{ color: colors.secondaryForeground }} className="font-medium text-sm">
                      Trip #{tripId.slice(-6)}
                    </Text>
                    <Text className="text-muted-foreground text-[10px] mt-1">
                      Truck: {truckId.slice(-6)} • Driver: {driverId.slice(-6)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text style={{ color: colors.primary }} className="font-semibold">
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
