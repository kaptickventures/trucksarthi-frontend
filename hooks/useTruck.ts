import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

import { Truck } from "../types/entity";

/* ---------------- HOOK ---------------- */

export default function useTrucks() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ---------------- */
  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/trucks");
      setTrucks(res.data);
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to load trucks"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- CREATE ---------------- */
  const addTruck = async (data: Partial<Truck>) => {
    try {
      const res = await API.post(`/api/trucks`, data);
      setTrucks((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to add truck"
      );
      throw error;
    }
  };

  /* ---------------- UPDATE (BASIC INFO) ---------------- */
  const updateTruck = async (
    id: string,
    updatedData: Partial<Truck>
  ) => {
    try {
      const res = await API.put(`/api/trucks/${id}`, updatedData);
      setTrucks((prev) =>
        prev.map((t) => (t._id === id ? res.data : t))
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to update truck"
      );
      throw error;
    }
  };

  /* ---------------- UPDATE IMPORTANT DATES ---------------- */
  const updateImportantDates = async (
    id: string,
    dates: any
  ) => {
    try {
      const res = await API.patch(
        `/api/trucks/${id}/important-dates`,
        dates
      );

      setTrucks((prev) =>
        prev.map((t) => (t._id === id ? res.data : t))
      );

      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to update important dates"
      );
      throw error;
    }
  };

  /* ---------------- DELETE ---------------- */
  const deleteTruck = async (id: string) => {
    try {
      await API.delete(`/api/trucks/${id}`);
      setTrucks((prev) => prev.filter((t) => t._id !== id));
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to delete truck"
      );
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  return {
    trucks,
    loading,
    fetchTrucks,
    addTruck,
    updateTruck,
    updateImportantDates,
    deleteTruck,
  };
}
