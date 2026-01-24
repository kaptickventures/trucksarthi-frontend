import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

import { Location } from "../types/entity";

export default function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/locations");
      setLocations(res.data);
    } catch (error: any) {
      console.error("Fetch error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  const addLocation = async (data: Partial<Location>) => {
    try {
      const res = await API.post(`/api/locations`, data);
      setLocations((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error("Add error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add location");
      throw error;
    }
  };

  const updateLocation = async (id: string, updatedData: Partial<Location>) => {
    try {
      const res = await API.put(`/api/locations/${id}`, updatedData);
      setLocations((prev) =>
        prev.map((l) => (l._id === id ? res.data : l))
      );
      return res.data;
    } catch (error: any) {
      console.error("Update error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update location");
      throw error;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      await API.delete(`/api/locations/${id}`);
      setLocations((prev) => prev.filter((l) => l._id !== id));
    } catch (error: any) {
      console.error("Delete error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to delete location");
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, fetchLocations, addLocation, updateLocation, deleteLocation };
}
