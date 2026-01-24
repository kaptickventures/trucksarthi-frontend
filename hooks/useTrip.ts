import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

import { Trip } from "../types/entity";
export { Trip };

interface UseTripsOptions {
  autoFetch?: boolean;
}

export default function useTrips(options: UseTripsOptions = {}) {
  const { autoFetch = true } = options;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/trips");
      setTrips(res.data);
    } catch (error) {
      console.error("❌ fetchTrips failed", error);
      Alert.alert("Error", "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchTrips();
    }
  }, [autoFetch, fetchTrips]);

  const addTrip = async (formData: any) => {
    try {
      const res = await API.post(`/api/trips`, formData);
      setTrips((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add trip");
      throw error;
    }
  };

  const updateTrip = async (tripId: string, updateData: any) => {
    try {
      const res = await API.put(`/api/trips/${tripId}`, updateData);
      setTrips((prev) =>
        prev.map((t) => (t._id === tripId ? res.data : t))
      );
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update trip");
      throw error;
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      await API.delete(`/api/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
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
