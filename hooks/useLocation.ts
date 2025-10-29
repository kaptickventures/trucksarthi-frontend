import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

interface Location {
  location_id: number;
  location_name: string;
  complete_address: string;
  user_id: number;
}

export default function useLocations(userId: number) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/locations/user/${userId}`);
      setLocations(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addLocation = async (formData: any) => {
    try {
      const res = await API.post(`/api/locations`, { ...formData, user_id: userId });
      setLocations((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add location");
      throw error;
    }
  };

  const deleteLocation = async (id: number) => {
    try {
      await API.delete(`/api/locations/${id}`);
      setLocations((prev) => prev.filter((l) => l.location_id !== id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete location");
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, fetchLocations, addLocation, deleteLocation };
}
