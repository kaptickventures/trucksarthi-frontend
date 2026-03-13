import { useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { create } from "zustand";
import API from "../app/api/axiosInstance";

import { Trip } from "../types/entity";
export { Trip };

interface UseTripsOptions {
  autoFetch?: boolean;
}

type TripStore = {
  trips: Trip[];
  loading: boolean;
  fetchTrips: () => Promise<void>;
  addTrip: (formData: any) => Promise<any>;
  updateTrip: (tripId: string, updateData: any) => Promise<any>;
  deleteTrip: (tripId: string) => Promise<void>;
};

const useTripStore = create<TripStore>((set) => ({
  trips: [],
  loading: false,
  fetchTrips: async () => {
    try {
      set({ loading: true });
      const res = await API.get("/api/trips");
      set({ trips: res.data });
    } catch (error) {
      console.error("âŒ fetchTrips failed", error);
      Alert.alert("Error", "Failed to load trips");
    } finally {
      set({ loading: false });
    }
  },
  addTrip: async (formData: any) => {
    try {
      const res = await API.post(`/api/trips`, formData);
      set((state) => ({ trips: [...state.trips, res.data] }));
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add trip");
      throw error;
    }
  },
  updateTrip: async (tripId: string, updateData: any) => {
    try {
      const res = await API.put(`/api/trips/${tripId}`, updateData);
      set((state) => ({
        trips: state.trips.map((t) => (t._id === tripId ? res.data : t)),
      }));
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update trip");
      throw error;
    }
  },
  deleteTrip: async (tripId: string) => {
    try {
      await API.delete(`/api/trips/${tripId}`);
      set((state) => ({ trips: state.trips.filter((t) => t._id !== tripId) }));
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to delete trip");
      throw error;
    }
  },
}));

export default function useTrips(options: UseTripsOptions = {}) {
  const { autoFetch = true } = options;

  const trips = useTripStore((state) => state.trips);
  const loading = useTripStore((state) => state.loading);
  const fetchTrips = useTripStore((state) => state.fetchTrips);
  const addTrip = useTripStore((state) => state.addTrip);
  const updateTrip = useTripStore((state) => state.updateTrip);
  const deleteTrip = useTripStore((state) => state.deleteTrip);

  useEffect(() => {
    if (autoFetch) {
      fetchTrips();
    }
  }, [autoFetch, fetchTrips]);

  const totalRevenue = useMemo(
    () =>
      trips.reduce(
        (acc, t) =>
          acc + Number(t.cost_of_trip || 0) + Number(t.miscellaneous_expense || 0),
        0
      ),
    [trips]
  );

  const totalTrips = trips.length;
  const recentTrips = useMemo(
    () =>
      [...trips].sort((a, b) => {
        const aTime = new Date(
          (a as any).trip_date || (a as any).createdAt || 0
        ).getTime();
        const bTime = new Date(
          (b as any).trip_date || (b as any).createdAt || 0
        ).getTime();
        return bTime - aTime;
      }),
    [trips]
  );

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
