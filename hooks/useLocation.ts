import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

interface Location {
  location_id: number;
  location_name: string;
  complete_address: string;


  
}

export default function useLocations(firebase_uid: string) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/locations/user/firebase/${firebase_uid}`);
      setLocations(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [firebase_uid]);

  const addLocation = async (formData: any) => {
    try {
      const res = await API.post(`/api/locations`, {
        ...formData,
        firebase_uid,
      });
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
