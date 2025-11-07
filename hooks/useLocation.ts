import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

interface Location {
  location_id: number;
  location_name: string;
  complete_address: string;
}

export default function useLocations(firebase_uid?: string) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!firebase_uid) return; // Prevent 400
    try {
      setLoading(true);
      const res = await API.get(`/api/locations/user/firebase/${firebase_uid}`);
      setLocations(res.data);
    } catch (error: any) {
      console.error("Fetch error:", error?.response?.data || error);
      Alert.alert("Error", error?.response?.data?.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [firebase_uid]);

  const addLocation = async (formData: any) => {
    if (!firebase_uid) return;
    try {
      const res = await API.post(`/api/locations`, { ...formData, firebase_uid });
      setLocations((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error("Add error:", error?.response?.data || error);
      Alert.alert("Error", error?.response?.data?.message || "Failed to add location");
      throw error;
    }
  };

  const updateLocation = async (id: number, updatedData: any) => {
    if (!firebase_uid) return;
    try {
      const res = await API.put(`/api/locations/${id}`, { ...updatedData, firebase_uid });
      setLocations((prev) => prev.map((l) => (l.location_id === id ? res.data : l)));
      return res.data;
    } catch (error: any) {
      console.error("Update error:", error?.response?.data || error);
      Alert.alert("Error", error?.response?.data?.message || "Failed to update location");
      throw error;
    }
  };

  const deleteLocation = async (id: number) => {
    if (!firebase_uid) return;
    try {
      await API.delete(`/api/locations/${id}`);
      setLocations((prev) => prev.filter((l) => l.location_id !== id));
    } catch (error: any) {
      console.error("Delete error:", error?.response?.data || error);
      Alert.alert("Error", error?.response?.data?.message || "Failed to delete location");
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, fetchLocations, addLocation, updateLocation, deleteLocation };
}
