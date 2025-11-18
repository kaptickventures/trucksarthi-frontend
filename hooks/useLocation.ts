import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface Location {
  location_id: number;
  firebase_uid: string;
  location_name: string;
  complete_address?: string;
  latitude?: number;
  longitude?: number;
}

export default function useLocations(firebase_uid?: string) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!firebase_uid) return;

    try {
      setLoading(true);
      const res = await API.get(`/api/locations/user/firebase/${firebase_uid}`);
      setLocations(res.data);
    } catch (error: any) {
      console.error("Fetch error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [firebase_uid]);

  const addLocation = async (data: Partial<Location>) => {
    if (!firebase_uid) return;

    try {
      const payload = { ...data, firebase_uid };
      const res = await API.post(`/api/locations`, payload);
      setLocations((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error("Add error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add location");
      throw error;
    }
  };

  const updateLocation = async (id: number, updatedData: Partial<Location>) => {
    if (!firebase_uid) return;

    try {
      const res = await API.put(`/api/locations/${id}`, updatedData);
      setLocations((prev) =>
        prev.map((l) => (l.location_id === id ? res.data : l))
      );
      return res.data;
    } catch (error: any) {
      console.error("Update error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update location");
      throw error;
    }
  };

  const deleteLocation = async (id: number) => {
    try {
      await API.delete(`/api/locations/${id}`);
      setLocations((prev) => prev.filter((l) => l.location_id !== id));
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
