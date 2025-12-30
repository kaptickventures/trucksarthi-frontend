import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface Trip {
  trip_id: number;
  trip_date: string;
  truck_id: number;
  driver_id: number;
  client_id: number;
  start_location_id: number;
  end_location_id: number;
  cost_of_trip: number;
  miscellaneous_expense: number;
  notes: string;
  invoiced_status: "invoiced" | "not_invoiced";
}

interface UseTripsOptions {
  autoFetch?: boolean;
}

export default function useTrips(
  firebase_uid: string,
  options: UseTripsOptions = {}
) {
  const { autoFetch = true } = options;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrips = useCallback(
    async (uid?: string) => {
      const effectiveUid = uid || firebase_uid;

      if (!effectiveUid) {
        console.log("⛔ fetchTrips skipped — missing firebase_uid");
        return;
      }

      try {
        setLoading(true);
        console.log("🚀 fetchTrips", effectiveUid);

        const res = await API.get(
          `/api/trips/user/firebase/${effectiveUid}`
        );

        setTrips(res.data);
        console.log("✅ trips fetched:", res.data.length);
      } catch (error) {
        console.error("❌ fetchTrips failed", error);
        Alert.alert("Error", "Failed to load trips");
      } finally {
        setLoading(false);
      }
    },
    [firebase_uid]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchTrips(firebase_uid);
    }
  }, [autoFetch, firebase_uid, fetchTrips]);

  const addTrip = async (formData: any) => {
    try {
      const res = await API.post(`/api/trips`, {
        ...formData,
        firebase_uid,
      });
      setTrips((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add trip");
      throw error;
    }
  };

  const updateTrip = async (tripId: number, updateData: any) => {
    try {
      const res = await API.put(`/api/trips/${tripId}`, updateData);
      setTrips((prev) =>
        prev.map((t) => (t.trip_id === tripId ? res.data : t))
      );
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update trip");
      throw error;
    }
  };

  const deleteTrip = async (tripId: number) => {
    try {
      await API.delete(`/api/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t.trip_id !== tripId));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete trip");
    }
  };

  const totalRevenue = trips.reduce(
    (acc, t) => acc + Number(t.cost_of_trip),
    0
  );

  const totalTrips = trips.length;
  const recentTrips = trips.slice(-3).reverse();

  return {
    trips,
    loading,
    totalRevenue,
    totalTrips,
    recentTrips,
    fetchTrips,
    addTrip,
    updateTrip,
    deleteTrip,
  };
}
