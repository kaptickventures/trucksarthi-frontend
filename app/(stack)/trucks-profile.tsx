import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { AlertTriangle, FileText, Plus, Truck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useDrivers from "../../hooks/useDriver";
import useTrips, { Trip } from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";
import useTruckDocuments from "../../hooks/useTruckDocuments";

/* ---------------- HELPERS ---------------- */

const isExpiringSoon = (date: string) => {
  const diff =
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
};

const DOCUMENT_TYPES = ["RC", "INSURANCE", "PERMIT", "FITNESS"];

/* ---------------- SCREEN ---------------- */

export default function TruckProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  /* ---------------- ROUTE PARAM ---------------- */
  const { truckId } = useLocalSearchParams<{ truckId?: string | string[] }>();

  const numericTruckId = useMemo(() => {
    if (!truckId) return null;
    const raw = Array.isArray(truckId) ? truckId[0] : truckId;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }, [truckId]);

  /* ---------------- AUTH ---------------- */
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, [auth]);

  const firebase_uid = user?.uid ?? "";

  /* ---------------- DATA HOOKS ---------------- */
  const { trucks, loading: trucksLoading, fetchTrucks } =
    useTrucks(firebase_uid);

  const { documents, fetchDocumentsByTruck, uploadDocument } =
    useTruckDocuments(firebase_uid);

  const { trips, fetchTrips } = useTrips(firebase_uid, { autoFetch: false });
  const { drivers } = useDrivers(firebase_uid);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!firebase_uid) return;
    fetchTrucks();
  }, [firebase_uid, fetchTrucks]);

  useEffect(() => {
    if (!firebase_uid || !numericTruckId) return;
    fetchDocumentsByTruck(numericTruckId);
    fetchTrips();
  }, [firebase_uid, numericTruckId, fetchDocumentsByTruck, fetchTrips]);

  /* ---------------- DERIVED ---------------- */
  const truck = useMemo(() => {
    if (!numericTruckId) return undefined;
    return trucks.find(
      (t) => Number(t.truck_id) === Number(numericTruckId)
    );
  }, [trucks, numericTruckId]);

  const truckTrips = trips.filter(
    (t: Trip) => Number(t.truck_id) === Number(numericTruckId)
  );

  const driverMap = useMemo(
    () =>
      Object.fromEntries(
        drivers.map((d) => [Number(d.driver_id), d.driver_name])
      ),
    [drivers]
  );

  /* ---------------- UPLOAD ---------------- */
  const handleUpload = async (type: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ compatible
        allowsEditing: true,
        quality: 0.3,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      await uploadDocument({
        truck_id: numericTruckId!,
        document_type: type,
        expiry_date: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        file: {
          uri: asset.uri,
          name: `${type}.jpg`,
          type: "image/jpeg",
        },
      });

      fetchDocumentsByTruck(numericTruckId!);
    } catch (e) {
      // Error handled in hook (Alert shown there)
      console.error(e);
    }
  };

  /* ---------------- GUARDS ---------------- */
  if (authLoading || trucksLoading || !numericTruckId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!truck) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Truck not found</Text>
      </SafeAreaView>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Truck Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* TRUCK CARD */}
        <View className="bg-card rounded-2xl p-4 mb-6">
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-secondary rounded-full items-center justify-center mr-4">
              <Truck size={26} color="#2563EB" />
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold">
                {truck.registration_number}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {truck.registered_owner_name}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mt-4">
            <Text className="text-xs">
              Capacity: {truck.loading_capacity} T
            </Text>
            <Text className="text-xs">
              Container: {truck.container_dimension} ft
            </Text>
          </View>
        </View>

        {/* DOCUMENTS */}
        <Text className="text-lg font-bold mb-3">Documents</Text>

        {DOCUMENT_TYPES.map((type) => {
          const doc = documents.find((d) => d.document_type === type);
          const expiring = doc && isExpiringSoon(doc.expiry_date);

          return (
            <TouchableOpacity
              key={type}
              onPress={() => handleUpload(type)}
              className="bg-card rounded-2xl p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <FileText size={20} color="#16a34a" />
                <View className="ml-3">
                  <Text className="font-semibold">{type}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {doc ? `Expiry: ${doc.expiry_date}` : "Upload document"}
                  </Text>
                </View>
              </View>

              {expiring && <AlertTriangle size={18} color="#dc2626" />}
            </TouchableOpacity>
          );
        })}

        {/* TRIPS */}
        <Text className="text-lg font-bold mt-8 mb-3">Trips</Text>

        {truckTrips.length === 0 ? (
          <Text className="text-muted-foreground">No trips yet</Text>
        ) : (
          truckTrips.map((t) => (
            <View key={t.trip_id} className="bg-card rounded-xl p-4 mb-2">
              <Text className="font-semibold">
                Trip #{t.trip_id} • ₹
                {Number(t.cost_of_trip).toLocaleString()}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Driver: {driverMap[t.driver_id] || "—"}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => handleUpload("RC")}
        className="absolute bottom-8 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
