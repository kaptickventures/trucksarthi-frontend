import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

interface Trip {
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
}

export default function useTrips(userId: number) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch trips for a particular user
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/trips/user/${userId}`);
      setTrips(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ✅ Add new trip
  const addTrip = async (formData: any) => {
    try {
      const res = await API.post(`/api/trips`, { ...formData, user_id: userId });
      setTrips((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add trip");
      throw error;
    }
  };

  // ✅ Update trip
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

  // ✅ Delete trip
  const deleteTrip = async (tripId: number) => {
    try {
      await API.delete(`/api/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t.trip_id !== tripId));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete trip");
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

    // ✅ Calculations
  const totalRevenue = trips.reduce((acc, t) => acc + t.cost_of_trip, 0);
  const totalTrips = trips.length;
  const recentTrips = trips.slice(-3).reverse(); // show 3 most recent trips


  return { trips, loading, totalRevenue, totalTrips, recentTrips, fetchTrips, addTrip, updateTrip, deleteTrip };
}
